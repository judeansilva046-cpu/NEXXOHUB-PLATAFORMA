import { strFromU8, unzipSync } from 'fflate';
import { quickImportConfigs, type QuickImportType } from './config';

export type ParsedImportRow = {
  rowNumber: number;
  raw: Record<string, string>;
  values: Record<string, string>;
};

export type ImportIssue = {
  rowNumber: number;
  field?: string;
  code: string;
  message: string;
  severity: 'warning' | 'error';
  rowData?: Record<string, string>;
};

export type ValidatedImportRow = ParsedImportRow & {
  normalized: Record<string, string | number | null>;
  errors: ImportIssue[];
  warnings: ImportIssue[];
};

export type ReferenceData = {
  existingCompanyCnpjs?: Set<string>;
  existingBranchNames?: Set<string>;
  existingDepartments?: Map<string, { id: string; name: string; branchName?: string | null }>;
  existingPositionNames?: Set<string>;
  existingEmployeeEmails?: Set<string>;
  existingEmployeeCpfs?: Set<string>;
  createMissingStructure?: boolean;
};

export type ValidationResult = {
  rows: ValidatedImportRow[];
  issues: ImportIssue[];
  missingHeaders: string[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    errorCount: number;
    warningCount: number;
    pendingStructure: {
      branches: string[];
      departments: string[];
      positions: string[];
    };
  };
};

export function normalizeKey(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function digitsOnly(value: unknown) {
  return String(value ?? '').replace(/\D/g, '');
}

export function normalizeText(value: unknown) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

export async function parseImportFile(file: File, importType: QuickImportType) {
  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (name.endsWith('.csv') || file.type.includes('csv')) {
    return canonicalizeRows(parseCsv(buffer.toString('utf8')), importType);
  }

  if (name.endsWith('.xlsx') || file.type.includes('spreadsheetml.sheet')) {
    return canonicalizeRows(parseXlsx(buffer), importType);
  }

  if (name.endsWith('.xls')) {
    throw new Error(
      'Arquivos .xls legados não são processados por segurança. Salve como .xlsx ou CSV e envie novamente.'
    );
  }

  throw new Error('Formato não suportado. Envie .csv, .xlsx ou .xls.');
}

export function parseCsv(content: string) {
  const text = content.replace(/^\uFEFF/, '');
  const delimiter = detectDelimiter(text);
  const records: string[][] = [];
  let current = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === delimiter) {
      row.push(current);
      current = '';
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(current);
      records.push(row);
      row = [];
      current = '';
      continue;
    }

    current += char;
  }

  if (current.length || row.length) {
    row.push(current);
    records.push(row);
  }

  const [headers = [], ...dataRows] = records.filter((record) =>
    record.some((cell) => normalizeText(cell))
  );

  return dataRows.map((cells) =>
    Object.fromEntries(
      headers.map((header, index) => [normalizeText(header), normalizeText(cells[index])])
    )
  );
}

export function parseXlsx(buffer: Buffer) {
  const zip = unzipSync(new Uint8Array(buffer));
  const readText = (path: string) => {
    const file = zip[path];
    return file ? strFromU8(file) : '';
  };

  const sharedStrings = parseSharedStrings(readText('xl/sharedStrings.xml'));
  const workbook = readText('xl/workbook.xml');
  const relationships = readText('xl/_rels/workbook.xml.rels');
  const firstSheetRel = workbook.match(/<sheet\b[^>]*r:id="([^"]+)"/)?.[1];
  const firstSheetTarget =
    firstSheetRel &&
    relationships.match(
      new RegExp(`<Relationship[^>]*Id="${escapeRegex(firstSheetRel)}"[^>]*Target="([^"]+)"`)
    )?.[1];
  const sheetPath = firstSheetTarget
    ? `xl/${firstSheetTarget.replace(/^\/?xl\//, '')}`
    : 'xl/worksheets/sheet1.xml';
  const sheet = readText(sheetPath);
  if (!sheet) throw new Error('Não foi possível ler a primeira planilha do arquivo .xlsx.');

  const matrix = parseSheetRows(sheet, sharedStrings);
  const headerRowIndex = matrix.findIndex((row) => row.some(Boolean));
  if (headerRowIndex === -1) return [];

  const headers = matrix[headerRowIndex].map((cell) => normalizeText(cell));
  return matrix
    .slice(headerRowIndex + 1)
    .map((cells) =>
      Object.fromEntries(headers.map((header, index) => [header, normalizeText(cells[index])]))
    );
}

export function validateImportRows(
  importType: QuickImportType,
  rows: ParsedImportRow[],
  reference: ReferenceData = {}
): ValidationResult {
  const config = quickImportConfigs[importType];
  const presentKeys = new Set(
    rows.flatMap((row) => Object.keys(row.values).filter((key) => row.values[key]))
  );
  const missingHeaders = config.columns
    .filter((column) => column.required && !presentKeys.has(column.key))
    .map((column) => column.header);
  const issues: ImportIssue[] = [];
  const fileDuplicateTrackers = createDuplicateTrackers(importType);
  const pendingBranches = new Set<string>();
  const pendingDepartments = new Set<string>();
  const pendingPositions = new Set<string>();

  if (!rows.length) {
    issues.push({
      rowNumber: 1,
      code: 'empty_file',
      message: 'O arquivo não possui linhas de dados.',
      severity: 'error',
    });
  }

  for (const header of missingHeaders) {
    issues.push({
      rowNumber: 1,
      field: header,
      code: 'missing_header',
      message: `Coluna obrigatória ausente: ${header}.`,
      severity: 'error',
    });
  }

  const validatedRows = rows.map((row) => {
    const rowIssues: ImportIssue[] = [];
    const warnings: ImportIssue[] = [];
    const normalized = normalizeRow(importType, row.values);

    for (const column of config.columns.filter((item) => item.required)) {
      if (!normalizeText(row.values[column.key])) {
        rowIssues.push(
          issue(row, column.key, 'required', `Campo obrigatório ausente: ${column.header}.`)
        );
      }
    }

    validateCommonFields(importType, row, normalized, rowIssues);
    validateDuplicates(importType, row, normalized, rowIssues, fileDuplicateTrackers, reference);
    validateStructure(importType, row, normalized, rowIssues, warnings, reference, {
      pendingBranches,
      pendingDepartments,
      pendingPositions,
    });

    return { ...row, normalized, errors: rowIssues, warnings };
  });

  const rowIssues = validatedRows.flatMap((row) => [...row.errors, ...row.warnings]);
  issues.push(...rowIssues);

  const invalidRows = validatedRows.filter((row) => row.errors.length > 0).length;
  const errorCount = issues.filter((item) => item.severity === 'error').length;
  const warningCount = issues.filter((item) => item.severity === 'warning').length;

  return {
    rows: validatedRows,
    issues,
    missingHeaders,
    summary: {
      totalRows: rows.length,
      validRows: rows.length - invalidRows,
      invalidRows,
      errorCount,
      warningCount,
      pendingStructure: {
        branches: Array.from(pendingBranches).sort(),
        departments: Array.from(pendingDepartments).sort(),
        positions: Array.from(pendingPositions).sort(),
      },
    },
  };
}

export function makeTemplateCsv(importType: QuickImportType) {
  const config = quickImportConfigs[importType];
  const headers = config.columns.map((column) => column.header);
  const required = config.columns.map((column) => (column.required ? 'OBRIGATÓRIO' : 'Opcional'));
  const instructions = config.columns.map((column) => column.instructions);
  const examples = config.columns.map((column) => column.example);

  return [headers, required, instructions, examples].map(toCsvLine).join('\n');
}

export function safeFilename(name: string) {
  const [base, ...extensionParts] = name.split('.');
  const extension = extensionParts.pop();
  const normalized = normalizeKey(base || 'arquivo').slice(0, 80) || 'arquivo';
  return `${normalized}-${Date.now()}${extension ? `.${normalizeKey(extension)}` : ''}`;
}

function canonicalizeRows(
  rows: Record<string, string>[],
  importType: QuickImportType
): ParsedImportRow[] {
  const config = quickImportConfigs[importType];
  const aliasToKey = new Map<string, string>();
  for (const column of config.columns) {
    aliasToKey.set(normalizeKey(column.key), column.key);
    aliasToKey.set(normalizeKey(column.header), column.key);
    for (const alias of column.aliases) aliasToKey.set(normalizeKey(alias), column.key);
  }

  return rows
    .map((raw, index) => {
      const values: Record<string, string> = {};
      for (const [header, value] of Object.entries(raw)) {
        const key = aliasToKey.get(normalizeKey(header));
        if (key) values[key] = normalizeText(value);
      }
      return {
        rowNumber: index + 2,
        raw: Object.fromEntries(
          Object.entries(raw).map(([key, value]) => [key, normalizeText(value)])
        ),
        values,
      };
    })
    .filter((row) => Object.values(row.values).some(Boolean));
}

function detectDelimiter(text: string) {
  const firstLine = text.split(/\r?\n/).find(Boolean) || '';
  const candidates = [',', ';', '\t'];
  return candidates
    .map((delimiter) => ({ delimiter, count: firstLine.split(delimiter).length }))
    .sort((a, b) => b.count - a.count)[0].delimiter;
}

function parseSharedStrings(xml: string) {
  if (!xml) return [];
  const strings: string[] = [];
  for (const item of xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)) {
    const text = Array.from(item[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g))
      .map((match) => decodeXml(match[1]))
      .join('');
    strings.push(text);
  }
  return strings;
}

function parseSheetRows(xml: string, sharedStrings: string[]) {
  const rows: string[][] = [];
  for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: string[] = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attributes = cellMatch[1];
      const body = cellMatch[2];
      const ref = attributes.match(/\br="([A-Z]+)\d+"/)?.[1];
      const index = ref ? columnIndex(ref) : cells.length;
      const type = attributes.match(/\bt="([^"]+)"/)?.[1];
      const value = extractCellValue(body, type, sharedStrings);
      cells[index] = value;
    }
    rows.push(cells.map((cell) => cell || ''));
  }
  return rows;
}

function extractCellValue(body: string, type: string | undefined, sharedStrings: string[]) {
  if (type === 'inlineStr') {
    return decodeXml(
      Array.from(body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g))
        .map((match) => match[1])
        .join('')
    );
  }

  const raw = body.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1] || '';
  if (type === 's') return sharedStrings[Number(raw)] || '';
  if (type === 'b') return raw === '1' ? 'true' : 'false';
  return decodeXml(raw);
}

function columnIndex(letters: string) {
  return letters.split('').reduce((acc, letter) => acc * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeRow(importType: QuickImportType, values: Record<string, string>) {
  const normalized: Record<string, string | number | null> = {};
  for (const column of quickImportConfigs[importType].columns) {
    normalized[column.key] = normalizeText(values[column.key]) || null;
  }

  if ('email' in normalized && normalized.email) {
    normalized.email = String(normalized.email).toLowerCase();
  }
  if ('cnpj' in normalized && normalized.cnpj) {
    normalized.cnpj = digitsOnly(normalized.cnpj);
  }
  if ('cpf' in normalized && normalized.cpf) {
    normalized.cpf = digitsOnly(normalized.cpf);
  }
  if ('status' in normalized) {
    normalized.status = normalizeStatus(normalized.status);
  }
  if ('state' in normalized && normalized.state) {
    normalized.state = String(normalized.state).toUpperCase().slice(0, 2);
  }
  if ('gender' in normalized) {
    normalized.gender = normalizeGender(normalized.gender);
  }
  if ('employee_count' in normalized) {
    normalized.employee_count = Number.parseInt(digitsOnly(normalized.employee_count), 10) || 0;
  }
  if ('birth_date' in normalized) {
    normalized.birth_date = normalizeDate(normalized.birth_date);
  }
  if ('admission_date' in normalized) {
    normalized.admission_date = normalizeDate(normalized.admission_date);
  }

  return normalized;
}

function validateCommonFields(
  importType: QuickImportType,
  row: ParsedImportRow,
  normalized: Record<string, string | number | null>,
  issues: ImportIssue[]
) {
  if ('email' in normalized && normalized.email && !isEmail(String(normalized.email))) {
    issues.push(issue(row, 'email', 'invalid_email', 'E-mail inválido.'));
  }
  if ('cnpj' in normalized && normalized.cnpj && !isValidCnpj(String(normalized.cnpj))) {
    issues.push(issue(row, 'cnpj', 'invalid_cnpj', 'CNPJ inválido.'));
  }
  if ('cpf' in normalized && normalized.cpf && !isValidCpf(String(normalized.cpf))) {
    issues.push(issue(row, 'cpf', 'invalid_cpf', 'CPF inválido.'));
  }
  if ('state' in normalized && normalized.state && !/^[A-Z]{2}$/.test(String(normalized.state))) {
    issues.push(issue(row, 'state', 'invalid_state', 'Estado/UF deve ter 2 letras.'));
  }
  if ('birth_date' in normalized && !normalized.birth_date) {
    issues.push(issue(row, 'birth_date', 'invalid_date', 'Data de nascimento inválida.'));
  }
  if ('admission_date' in normalized && !normalized.admission_date) {
    issues.push(issue(row, 'admission_date', 'invalid_date', 'Data de admissão inválida.'));
  }
  if ('gender' in normalized && !normalized.gender) {
    issues.push(issue(row, 'gender', 'invalid_gender', 'Sexo deve ser M, F, O ou N.'));
  }
  if (importType === 'companies' && Number(normalized.employee_count || 0) < 0) {
    issues.push(
      issue(row, 'employee_count', 'invalid_number', 'Número de colaboradores inválido.')
    );
  }
}

function validateDuplicates(
  importType: QuickImportType,
  row: ParsedImportRow,
  normalized: Record<string, string | number | null>,
  issues: ImportIssue[],
  trackers: Record<string, Set<string>>,
  reference: ReferenceData
) {
  const checkFileDuplicate = (field: string, value: string | number | null | undefined) => {
    if (!value) return;
    const text = normalizeComparison(value);
    if (!trackers[field]) trackers[field] = new Set<string>();
    if (trackers[field].has(text)) {
      issues.push(issue(row, field, 'duplicate_in_file', `Duplicidade no arquivo para ${field}.`));
    }
    trackers[field].add(text);
  };

  if (importType === 'companies') {
    checkFileDuplicate('cnpj', normalized.cnpj);
    if (normalized.cnpj && reference.existingCompanyCnpjs?.has(String(normalized.cnpj))) {
      issues.push(issue(row, 'cnpj', 'duplicate_existing', 'CNPJ já cadastrado nesta clínica.'));
    }
  }
  if (importType === 'branches') {
    checkFileDuplicate('name', normalized.name);
    if (
      normalized.name &&
      reference.existingBranchNames?.has(normalizeComparison(normalized.name))
    ) {
      issues.push(
        issue(row, 'name', 'duplicate_existing', 'Filial já cadastrada para esta empresa.')
      );
    }
  }
  if (importType === 'departments') {
    checkFileDuplicate('name', normalized.name);
    if (
      normalized.name &&
      reference.existingDepartments?.has(normalizeComparison(normalized.name))
    ) {
      issues.push(
        issue(row, 'name', 'duplicate_existing', 'Departamento já cadastrado para esta empresa.')
      );
    }
  }
  if (importType === 'positions') {
    checkFileDuplicate('name', normalized.name);
    if (
      normalized.name &&
      reference.existingPositionNames?.has(normalizeComparison(normalized.name))
    ) {
      issues.push(
        issue(row, 'name', 'duplicate_existing', 'Cargo já cadastrado para esta empresa.')
      );
    }
  }
  if (importType === 'employees') {
    checkFileDuplicate('cpf', normalized.cpf);
    checkFileDuplicate('email', normalized.email);
    if (normalized.cpf && reference.existingEmployeeCpfs?.has(String(normalized.cpf))) {
      issues.push(issue(row, 'cpf', 'duplicate_existing', 'CPF já cadastrado neste tenant.'));
    }
    if (
      normalized.email &&
      reference.existingEmployeeEmails?.has(String(normalized.email).toLowerCase())
    ) {
      issues.push(issue(row, 'email', 'duplicate_existing', 'E-mail já cadastrado.'));
    }
  }
}

function validateStructure(
  importType: QuickImportType,
  row: ParsedImportRow,
  normalized: Record<string, string | number | null>,
  errors: ImportIssue[],
  warnings: ImportIssue[],
  reference: ReferenceData,
  pending: {
    pendingBranches: Set<string>;
    pendingDepartments: Set<string>;
    pendingPositions: Set<string>;
  }
) {
  if (importType === 'departments' && normalized.branch_name) {
    const branchName = normalizeComparison(normalized.branch_name);
    if (!reference.existingBranchNames?.has(branchName)) {
      errors.push(issue(row, 'branch_name', 'missing_branch', 'Filial informada não existe.'));
    }
  }

  if (importType === 'positions' && normalized.department_name) {
    const departmentName = normalizeComparison(normalized.department_name);
    if (!reference.existingDepartments?.has(departmentName)) {
      errors.push(
        issue(row, 'department_name', 'missing_department', 'Departamento informado não existe.')
      );
    }
  }

  if (importType !== 'employees') return;

  const branchName = normalized.branch_name ? normalizeComparison(normalized.branch_name) : '';
  const departmentName = normalized.department_name
    ? normalizeComparison(normalized.department_name)
    : '';
  const positionName = normalized.position_name
    ? normalizeComparison(normalized.position_name)
    : '';

  if (branchName && !reference.existingBranchNames?.has(branchName)) {
    pending.pendingBranches.add(String(normalized.branch_name));
    const target = reference.createMissingStructure ? warnings : errors;
    target.push(
      issue(
        row,
        'branch_name',
        'missing_branch',
        reference.createMissingStructure
          ? 'Filial será criada automaticamente na confirmação.'
          : 'Filial não existe. Ative criação automática ou corrija o arquivo.',
        reference.createMissingStructure ? 'warning' : 'error'
      )
    );
  }

  if (departmentName && !reference.existingDepartments?.has(departmentName)) {
    pending.pendingDepartments.add(String(normalized.department_name));
    const target = reference.createMissingStructure ? warnings : errors;
    target.push(
      issue(
        row,
        'department_name',
        'missing_department',
        reference.createMissingStructure
          ? 'Departamento será criado automaticamente na confirmação.'
          : 'Departamento não existe. Ative criação automática ou corrija o arquivo.',
        reference.createMissingStructure ? 'warning' : 'error'
      )
    );
  }

  if (positionName && !reference.existingPositionNames?.has(positionName)) {
    pending.pendingPositions.add(String(normalized.position_name));
    const target = reference.createMissingStructure ? warnings : errors;
    target.push(
      issue(
        row,
        'position_name',
        'missing_position',
        reference.createMissingStructure
          ? 'Cargo será criado automaticamente na confirmação.'
          : 'Cargo não existe. Ative criação automática ou corrija o arquivo.',
        reference.createMissingStructure ? 'warning' : 'error'
      )
    );
  }
}

function createDuplicateTrackers(importType: QuickImportType) {
  const trackers: Record<string, Set<string>> = {};
  if (importType === 'companies') trackers.cnpj = new Set<string>();
  if (importType === 'employees') {
    trackers.cpf = new Set<string>();
    trackers.email = new Set<string>();
  }
  return trackers;
}

function issue(
  row: ParsedImportRow,
  field: string | undefined,
  code: string,
  message: string,
  severity: 'warning' | 'error' = 'error'
): ImportIssue {
  return {
    rowNumber: row.rowNumber,
    field,
    code,
    message,
    severity,
    rowData: row.values,
  };
}

function normalizeComparison(value: string | number | null | undefined) {
  return normalizeKey(String(value ?? ''));
}

function normalizeStatus(value: unknown) {
  const key = normalizeKey(String(value ?? 'active'));
  if (['ativo', 'active', 'ativa'].includes(key)) return 'active';
  if (['inativo', 'inactive', 'inativa'].includes(key)) return 'inactive';
  if (['arquivado', 'archived', 'arquivo'].includes(key)) return 'archived';
  return key || 'active';
}

function normalizeGender(value: unknown) {
  const key = normalizeKey(String(value ?? ''));
  if (['m', 'masculino', 'male'].includes(key)) return 'M';
  if (['f', 'feminino', 'female'].includes(key)) return 'F';
  if (['o', 'outro', 'other'].includes(key)) return 'O';
  if (['n', 'nao_informado', 'nao_informada', 'nao', 'not_informed'].includes(key)) return 'N';
  return null;
}

function normalizeDate(value: unknown) {
  const text = normalizeText(value);
  if (!text) return null;
  if (/^\d{5}(\.\d+)?$/.test(text)) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    const date = new Date(excelEpoch + Number(text) * 24 * 60 * 60 * 1000);
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const brMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!brMatch) return null;
  const day = brMatch[1].padStart(2, '0');
  const month = brMatch[2].padStart(2, '0');
  const year = brMatch[3].length === 2 ? `20${brMatch[3]}` : brMatch[3];
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return `${year}-${month}-${day}`;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidCpf(value: string) {
  const cpf = digitsOnly(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  const calc = (length: number) => {
    const numbers = cpf.slice(0, length).split('').map(Number);
    const sum = numbers.reduce((acc, number, index) => acc + number * (length + 1 - index), 0);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

function isValidCnpj(value: string) {
  const cnpj = digitsOnly(value);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const calc = (base: string, weights: number[]) => {
    const sum = base
      .split('')
      .map(Number)
      .reduce((acc, number, index) => acc + number * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const first = calc(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = calc(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return first === Number(cnpj[12]) && second === Number(cnpj[13]);
}

function toCsvLine(cells: string[]) {
  return cells
    .map((cell) => {
      const escaped = String(cell).replace(/"/g, '""');
      return `"${escaped}"`;
    })
    .join(';');
}

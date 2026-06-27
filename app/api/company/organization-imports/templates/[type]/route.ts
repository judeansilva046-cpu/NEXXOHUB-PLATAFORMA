import { getErrorResponse, AuthorizationError } from '@/lib/errors';
import { assertQuickImportType, getTemplateResponse } from '@/lib/quick-onboarding/service';

type Context = { params: { type: string } };

export async function GET(_request: Request, { params }: Context) {
  try {
    const type = assertQuickImportType(params.type);
    if (type === 'companies') throw new AuthorizationError('Empresas não importam empresas.');
    return getTemplateResponse(type);
  } catch (error) {
    const result = getErrorResponse(error);
    return Response.json(result, { status: result.statusCode });
  }
}

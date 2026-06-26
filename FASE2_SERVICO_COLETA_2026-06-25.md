# NexxoHub — Fase 2: Serviço Seguro de Coleta Psicossocial

Data: 25/06/2026

Projeto Supabase: `xuhlhjpyukpqqpyixfct`

## Resultado

Foi implementado o fluxo técnico server-side de coleta psicossocial:

1. geração autorizada de convites por campanha;
2. token opaco armazenado somente como hash SHA-256;
3. consulta pública sem exposição da identidade do colaborador;
4. consentimento obrigatório e versionado;
5. criação atômica de sessão pseudonimizada;
6. emissão de token de retomada com validade de 24 horas;
7. salvamento incremental de respostas;
8. validação de que cada questão pertence à versão da sessão;
9. submissão somente com as 50 respostas obrigatórias;
10. cálculo de hash de integridade;
11. bloqueio da sessão e consumo do token após a submissão;
12. trilha técnica de eventos e limitação de requisições.

## Rotas implementadas

- `POST /api/psychosocial/campaigns/[id]/participants`
- `GET /api/psychosocial/collect/[token]`
- `POST /api/psychosocial/collect/[token]/start`
- `PUT /api/psychosocial/collect/session/answers`
- `POST /api/psychosocial/collect/session/submit`

As rotas de respostas e submissão exigem o token de retomada em:

```text
Authorization: Bearer <token>
```

## Controles de segurança

- `SUPABASE_SERVICE_ROLE_KEY` utilizada somente em módulo `server-only`;
- nenhuma chave privilegiada enviada ao navegador;
- `anon` e `authenticated` sem acesso ao schema `sensitive`;
- funções de coleta executáveis somente por `service_role`;
- respostas clínicas fora das tabelas públicas;
- tokens brutos nunca persistidos no banco;
- respostas sem polaridade ou fator expostos ao participante;
- cabeçalhos `no-store`, `no-referrer` e `nosniff`;
- mensagens internas do banco não são devolvidas em erros 500;
- rate limit por ação, token e fingerprint pseudonimizado;
- prevenção de novo convite após início, conclusão, invalidação ou retirada;
- proteção contra questões pertencentes a outra versão do instrumento.

## Migrações aplicadas

- `20260625054539_phase2_collection_service.sql`
- `20260625055215_phase2_collection_answer_integrity.sql`

## Validações

- TypeScript: aprovado;
- build Next.js de produção: aprovado;
- 53 testes unitários: aprovados;
- teste transacional do serviço no Supabase: aprovado;
- Supabase Security Advisor: zero alertas;
- privilégios de funções e schema: aprovados;
- migration history local alinhado ao remoto.

## Observação do ambiente local

O arquivo externo `C:\Users\User\package.json` está vazio. O Vitest executa e aprova
os 53 testes, mas encerra com código 1 quando o resolvedor tenta interpretar esse
arquivo pai inválido. O arquivo não foi alterado porque está fora do workspace da
plataforma.

## Próxima fase recomendada

Construir a experiência web do colaborador em `/avaliacao/[token]`, conectando-a
às rotas já protegidas:

1. apresentação de sigilo e consentimento;
2. questionário responsivo com progresso;
3. salvamento automático;
4. retomada segura da sessão;
5. confirmação de envio;
6. testes E2E completos do convite à submissão.

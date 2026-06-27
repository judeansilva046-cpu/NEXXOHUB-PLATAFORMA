import { getTemplateResponse, assertQuickImportType } from '@/lib/quick-onboarding/service';
import { getErrorResponse } from '@/lib/errors';

type Context = { params: { type: string } };

export async function GET(_request: Request, { params }: Context) {
  try {
    return getTemplateResponse(assertQuickImportType(params.type));
  } catch (error) {
    const result = getErrorResponse(error);
    return Response.json(result, { status: result.statusCode });
  }
}

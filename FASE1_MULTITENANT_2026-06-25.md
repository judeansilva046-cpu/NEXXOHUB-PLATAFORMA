# NexxoHub - Gate multi-tenant da Fase 1

Data: 25 de junho de 2026

Projeto: `NEXXOHUB-PLATAFORMA`

## Entregas

- Hierarquia NexxoHub → Clínica → Empresa → Colaborador.
- `portal_memberships` para os quatro portais.
- Escopos opcionais por unidade e departamento.
- Entidades `branches`, `departments` e `positions`.
- Coerência por chaves estrangeiras compostas entre tenant, clínica, empresa e colaborador.
- RLS contextual para clínicas, empresas, colaboradores e estrutura organizacional.
- Empresas obrigatoriamente vinculadas a uma clínica.
- Conta `judeansilva046@gmail.com` vinculada como `super_admin` do portal NexxoHub.
- Conta sem membership permanece sem acesso a portais.
- Respostas psicossociais brutas continuam bloqueadas.
- Aplicação atualizada para exigir a clínica responsável no cadastro de empresas.

## Testes de isolamento

Foi executado um teste transacional com duas clínicas e duas empresas. Um usuário temporariamente associado à Clínica A:

- visualizou apenas a Clínica A;
- visualizou apenas a Empresa A;
- visualizou apenas seu membership autorizado;
- visualizou apenas sua organização;
- permaneceu sem privilégio de leitura em `assessment_responses`.

Todas as fixtures foram desfeitas por rollback.

## Advisors

- Segurança: zero alertas.
- Performance: sem chaves estrangeiras sem índice e sem policies permissivas sobrepostas.
- Avisos restantes: índices ainda não utilizados, comportamento esperado em banco sem carga, e configuração informativa de conexões do Supabase Auth.

## Próximo gate

Fase 2 - Cofre Psicossocial:

- versões imutáveis do questionário;
- campanhas e ciclos T0/T90/T180/T365;
- registro de participantes separado das respostas;
- tokens pseudônimos;
- schema privado para respostas;
- limiares de anonimato aplicados no banco e nos serviços.

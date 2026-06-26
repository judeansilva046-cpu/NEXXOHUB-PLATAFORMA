# NexxoHub - Fase 2: Cofre Psicossocial

Data: 25 de junho de 2026

Projeto Supabase: `NEXXOHUB-PLATAFORMA`

## Resultado

O núcleo estrutural do Cofre Psicossocial foi concluído.

## Metodologia versionada

- Questionários e versões imutáveis após publicação.
- Exigência de exatamente 50 perguntas e 13 fatores.
- Escala fixa de 0 a 4.
- Polaridade explícita por pergunta: direta ou invertida.
- Mapeamento pergunta-fator com validação de mesma versão.
- Publicação bloqueada se houver quantidade incorreta ou pergunta sem fator.
- Nenhum conteúdo metodológico foi semeado automaticamente.

## Diagnóstico

- Ciclos T0, T90, T180, T365 e personalizados.
- Campanhas vinculadas a uma versão publicada.
- Campanhas em rascunho, agendadas, abertas, fechadas e processadas.
- Limiar mínimo de coorte igual ou superior a cinco.
- Empresas com até dez colaboradores tratadas pela regra de pequeno grupo.
- Segmentações permitidas: empresa, unidade, departamento, faixa etária e sexo.
- Cargo não é uma dimensão de segmentação psicossocial.

## Cofre privado

O schema `sensitive` contém:

- `participant_registry`;
- `participant_tokens`;
- `response_sessions`;
- `answers`;
- `consent_events`.

`anon` e `authenticated` não possuem acesso ao schema. Somente `service_role`
possui uso e privilégios nas tabelas, exclusivamente em código server-side.

## Separação de identidade

- Respostas não possuem nome, CPF, email, matrícula ou cargo.
- Respostas não referenciam diretamente o colaborador.
- O vínculo colaborador-participante permanece em `participant_registry`.
- Sessões utilizam participante pseudônimo e versão metodológica congelada.
- Tokens são armazenados somente como hash.

## Invariantes validados

- Participante deve pertencer à empresa da campanha.
- Sessão deve usar a versão do questionário da campanha.
- Resposta deve pertencer à mesma versão da sessão.
- Respostas não podem mudar após submissão.
- Conteúdo publicado não pode ser alterado ou apagado.
- Campanha não pode abrir com questionário em rascunho.

## Teste transacional

Foi criada uma metodologia temporária com 50 perguntas, 13 fatores e 50
mapeamentos. A publicação, campanha, participante, sessão e resposta válida
foram aceitos. As seguintes operações foram rejeitadas:

- alteração de pergunta publicada;
- abertura de campanha com versão em rascunho;
- participante pertencente a outra empresa;
- sessão com versão diferente da campanha;
- alteração de resposta após submissão.

Todos os dados do teste foram revertidos por rollback.

## Advisors

- Segurança Supabase: zero alertas.
- Chaves estrangeiras da fase: indexadas.
- Policies permissivas sobrepostas: removidas.
- Avisos restantes são índices ainda não utilizados, esperado antes da carga.

## Próximo gate

Implementar o serviço de coleta:

- criação segura de participantes e convites;
- geração e validação de tokens;
- APIs server-side para consentimento, início, salvamento e submissão;
- idempotência e rate limiting;
- auditoria sem conteúdo sensível;
- testes E2E com os portais.

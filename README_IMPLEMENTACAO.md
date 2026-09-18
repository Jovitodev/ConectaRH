# ConectaRH — implementação das novas funcionalidades

Esta versão transforma o protótipo em um MVP local persistente, preparado para migração para Supabase.

## Implementado

- Autenticação local persistente por sessão.
- Cadastro real de candidato no ambiente local.
- Senhas armazenadas como hash SHA-256 no armazenamento local (isto é apenas uma ponte para desenvolvimento; produção deve usar Supabase Auth).
- Recuperação de senha com token de demonstração e expiração de 15 minutos.
- Perfil de candidato ampliado: título profissional, CPF, nacionalidade, endereço detalhado, pretensão salarial, disponibilidade, preferência de trabalho, resumo e portfólio.
- Cálculo automático de progresso do perfil.
- Currículos múltiplos.
- Criar, duplicar, selecionar e excluir currículos, mantendo pelo menos um.
- Associação da candidatura ao currículo utilizado.
- Histórico de candidatura com registro de envio e avanço de etapa.
- Notificações persistentes no ambiente local.
- Marcação das notificações como lidas.
- Persistência local das candidaturas e currículos.
- Schema PostgreSQL/Supabase em `supabase/schema.sql`.

## O que ainda depende do Supabase/backend

- E-mails reais de recuperação/validação.
- OAuth/social login.
- Armazenamento privado de PDFs/certificados.
- RBAC definitivo no backend.
- Auditoria server-side.
- Dashboard e relatórios alimentados pelo banco.
- Integração real do painel de RH com as mesmas entidades usadas pelo candidato.
- Jobs/filas para notificações e e-mails.

## Próximo passo recomendado

1. Criar projeto Supabase.
2. Executar `supabase/schema.sql` após revisar as regras de negócio.
3. Configurar Supabase Auth.
4. Criar trigger de `auth.users` para `public.profiles`.
5. Migrar o `localStore/authStore` para serviços Supabase.
6. Criar Storage privado para documentos.
7. Completar RLS para recrutador, gestor e administrador.
8. Migrar vagas, candidatos, candidaturas, entrevistas e relatórios para consultas reais.

## Teste local

```bash
npm install
npm run build
npm run dev
```

### Acessos de demonstração

- Candidato: `candidato@conectarh.com` / `candidato123`
- Colaborador: `colaborador@conectarh.com` / `colaborador123`

As contas de demonstração são apenas para o protótipo. Em produção, remova credenciais fixas e use Supabase Auth.

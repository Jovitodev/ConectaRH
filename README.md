# 🚀 ConectaRH — ATS & Portal de Carreiras

O **ConectaRH** é um ecossistema completo de recrutamento e seleção (ATS - *Applicant Tracking System*) desenhado para unir candidatos às melhores oportunidades de tecnologia e gestão. O sistema conta com uma experiência bifurcada em dois perfis de acesso (**Candidato** e **Colaborador/Recrutador**), construído com uma interface moderna, intuitiva e acessível em **React, Tailwind CSS e shadcn/ui**[cite: 4].

---

## 🎨 Identidade Visual & UI/UX

A plataforma utiliza um design *clean* baseado na nova paleta de cores institucional[cite: 6]:
* **Background:** Tom suave em cinza/azul claríssimo (`#F4F7FB` / `#F8FAFC`)[cite: 6].
* **Cards & Elevação:** Brancos (`#FFFFFF`) com bordas sutis (`#E2E8F0`) e sombras leves[cite: 6, 7].
* **Ações Principais (CTA):** Azul Sereno/Vibrante (`#00A3E0` / `#0284C7`)[cite: 6, 7].
* **Acompanhamento de Status:** Verde Esmeralda (`#10B981` / `#059669`) para barras de progresso e etapas concluídas[cite: 7].

---

## ✨ Funcionalidades Principais

### 👤 Perfil do Candidato
* **Autenticação & Registro:** Login simplificado e cadastro profissional[cite: 6].
* **Busca de Vagas:** Filtros dinâmicos por setor, modalidade (Presencial, Híbrido, Remoto) e tipo de contrato (CLT, PJ)[cite: 7].
* **Candidatura Rápida:** Submissão de currículo em 1 clique[cite: 7].
* **Minhas Candidaturas:** Acompanhamento em tempo real do status do processo seletivo através da barra de progresso do pipeline[cite: 7].
* **Gestão de Currículo:** Cadastro estruturado de dados pessoais, formação acadêmica, experiências e certificados[cite: 7].

### 💼 Perfil do Colaborador (Recrutador / Gestor)
* **Dashboard Analítico:** Indicadores estratégicos de RH (Time-to-Hire, funil de conversão e métricas de contratação)[cite: 4].
* **Gestão de Vagas:** Criação, edição, templates de vagas e controle de status (Rascunho, Publicada, Pausada, Encerrada)[cite: 4].
* **Base Geral de Candidatos:** Tabela avançada (`Data Table`) com busca por CPF, e-mail e nome[cite: 4].
* **Perfil Detalhado & Avaliação:** Análise de competências, notas de feedback e painel de ações (Aprovar, Reprovar, Enviar Proposta)[cite: 4].
* **Kanban de Seleção:** Quadro visual interativo para gestão do funil de candidatos (*Triagem, Teste, Entrevista RH, Entrevista Gestor, Proposta*)[cite: 4].
* **Agendamento & Agenda:** Gestão de entrevistas, links de reunião e controle de pendências[cite: 4].
* **Governança & LGPD:** Ferramenta de anonimização irreversível de dados de candidatos e gestão de papéis da equipe[cite: 4].

---

## 🛠️ Tecnologias Utilizadas

* **Core:** React 18 / Vite
* **Estilização:** Tailwind CSS
* **Componentes UI:** [shadcn/ui](https://ui.shadcn.com/) / Radix UI
* **Ícones:** Lucide React
* **Gerenciamento de Formulários & Estados:** React Hook Form, Zod

---

## 🔑 Acesso Rápido para Demonstração (Logins Mockados)

Ao acessar a tela de login, podes utilizar as seguintes credenciais de teste:

| Perfil | E-mail | Acesso |
| :--- | :--- | :--- |
| **Candidato** | `candidato@conectarh.com` | Portal de Vagas, Candidaturas e Currículo[cite: 4] |
| **Colaborador** | `colaborador@conectarh.com` | Painel Administrativo, Kanban, Vagas e Relatórios[cite: 4] |

---

## 📦 Como Executar o Projeto Localmente

1. **Clona o repositório:**
   ```bash
   git clone [https://github.com/teu-usuario/conecta-rh.git](https://github.com/teu-usuario/conecta-rh.git)
   cd conecta-rh

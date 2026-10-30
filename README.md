# 💰 Meu Financeiro — Controle de Gastos Pessoal (Web + Mobile + Nuvem)

Aplicação moderna de gestão financeira pessoal desenvolvida sob medida para controle de **Receitas (Salário)**, **Contas Fixas**, **Cartões de Crédito** e **Indicadores Visuais Inteligentes com Alerta Vermelho**.

Construída como uma **PWA (Progressive Web App)**: você desenvolve e roda pelo VS Code e pode utilizá-la no computador, no **Android** e no **iPhone**, com visual de fintech bancária de alto nível e dados sincronizados.

---

## 🚀 Principais Funcionalidades

### 1. 📊 Painel Geral (Dashboard)
- **Saldo Previsto no Mês**: Cálculo antecipado de quanto sobrará do salário antes mesmo de pagar as contas.
- **Comprometimento da Renda**: Percentual exato do salário consumido com despesas.
- **🚨 Sistema Inteligente de Alertas**:
  - 🟢 **Sob Controle (< 80%)**: Destaque verde com saldo positivo para poupança/investimentos.
  - 🟡 **Atenção (80% a 99%)**: Alerta amarelo quando a margem de segurança do orçamento estiver apertada.
  - 🔴 **ALERTA VERMELHO CRÍTICO (≥ 100% ou Salário < Dívidas)**: Notificação chamativa com valor do déficit em destaque vermelho caso as dívidas ultrapassem a renda mensal.
- **Gráficos Interativos (Recharts)**:
  - Gráfico de Rosca / Donut com a distribuição percentual das despesas.
  - Gráfico de Barras comparando Receita Total vs Despesas Totais vs Realizado.
- **Próximos Vencimentos**: Acompanhamento rápido com botão de alternância entre *Pendente* e *Pago* com 1 clique (com efeito de comemoração ao pagar).

### 2. 🧾 Minhas Contas (Lançamentos)
- Pré-configurada com as suas 4 contas fixas e 2 cartões:
  - **Internet**
  - **Celular**
  - **Seguro Carro**
  - **Seguro Moto**
  - **Cartão Inter**
  - **Cartão Nubank**
  - Contas adicionais personalizadas
- Filtros rápidos: *Todas*, *Fixas*, *Cartões*, *Pendentes* e *Pagas*.
- Botão **"Gerar Fixas do Mês"**: replica o modelo de despesas fixas para o mês selecionado sem ter que redigitar tudo.
- Edição, exclusão e busca em tempo real.

### 3. 💵 Receitas & Salário
- Cadastro do Salário Líquido Mensal e dia de recebimento.
- Inclusão de rendas extras (Freelances, 13º salário, bonificações, reembolsos).
- Análise visual de cobertura da renda antes do uso dos cartões.

### 4. 📈 Relatórios & Histórico
- Evolução financeira ao longo dos meses.
- Gráfico comparativo entre os cartões **Inter** vs **Nubank**.
- **Exportação para CSV / Excel** para controle em planilhas.

### 5. ⚙️ Nuvem & PWA (Computador + Celular)
- **Supabase Cloud**: Conexão com banco PostgreSQL e login seguro por e-mail e senha.
- **Modo Offline / Local First**: Funciona imediatamente pelo navegador mesmo sem criar conta, salvando tudo no LocalStorage.
- **Temas**: Alternância instantânea entre **Dark Premium** e **Light Clean**.
- Backup e Restauração de dados via arquivo `.json`.

---

## 🛠️ Tecnologias Utilizadas

- **React 19 + TypeScript**
- **Vite 8**
- **Tailwind CSS v4**
- **Recharts** (Gráficos financeiros interativos)
- **Lucide React** (Ícones modernos)
- **@supabase/supabase-js** (Autenticação e sincronização na nuvem)
- **Vite PWA Plugin** (Manifest, Service Worker e instalação mobile)

---

## 💻 Como Rodar no VS Code

### Passo 1: Abrir no VS Code
Abra a pasta do projeto no VS Code:
```bash
c:\Users\gabri\OneDrive\Desktop\Projetofinancas
```

### Passo 2: Iniciar o Servidor de Desenvolvimento
No terminal integrado do VS Code (`Ctrl + '` ou `Terminal > Novo Terminal`):
```bash
npm run dev
```

O Vite iniciará o servidor local e exibirá o link:
```
➜  Local:   http://localhost:5173/
```
Pressione `Ctrl + Clique` no link ou abra no seu navegador favorito.

---

## ☁️ Como Configurar a Nuvem (Supabase)

O projeto já está 100% pronto para conectar com o Supabase gratuito:

1. Acesse [supabase.com](https://supabase.com) e crie um projeto gratuito.
2. No menu lateral do Supabase, clique em **SQL Editor** e copie/cole todo o conteúdo do arquivo:
   ```
   supabase/schema.sql
   ```
   Clique em **Run** para criar automaticamente todas as tabelas e políticas de segurança RLS.
3. No Supabase, vá em **Project Settings > API** e copie:
   - **Project URL**
   - **Project API anon / public key**
4. Você pode colar essas duas chaves diretamente na tela de **Configurações** do próprio aplicativo (ou adicionar no arquivo `.env.local`).
5. Clique em **Fazer Login / Cadastro** e pronto! Seus dados estarão sincronizados entre o computador e o celular.

---

## 📱 Como Usar e Instalar no Celular

### Opção A — Em Rede Local (Durante o Desenvolvimento)
No terminal do VS Code, execute:
```bash
npm run dev -- --host
```
O Vite mostrará um link de rede (ex: `http://192.168.1.X:5173`). Basta abrir esse link no navegador do celular conectado ao mesmo Wi-Fi.

### Opção B — Publicar Gratuitamente na Nuvem (Vercel)
Para acessar de qualquer lugar pelo celular com HTTPS:
1. Suba o projeto para o GitHub.
2. Acesse [vercel.com](https://vercel.com) e importe o repositório.
3. Clique em **Deploy**. Você receberá um link `https://seu-projeto.vercel.app`.

### Como Instalar como Aplicativo no Celular:
- **No Android (Google Chrome)**: Toque nos 3 pontinhos no canto superior direito e selecione **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.
- **No iPhone (Safari)**: Toque no botão de **Compartilhar** (quadrado com seta para cima) e escolha **"Adicionar à Tela de Início"**.

O ícone do **Meu Financeiro** aparecerá na grade de aplicativos do seu celular e abrirá em tela cheia sem barras de navegador.

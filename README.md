# Projeto E-commerce Node.js & MySQL (M3)

Este projeto implementa o back-end e a lógica de persistência de um sistema de e-commerce. A aplicação consome dados de produtos de uma API externa (FakeStore) e gerencia o fluxo transacional de compra (catálogo, carrinho, checkout e pedidos) em um banco de dados MySQL, garantindo a integridade do estoque através de transações.

## 1. Tecnologias Utilizadas

| Categoria | Tecnologia | Versão | Descrição |
| :--- | :--- | :--- | :--- |
| **Linguagem** | JavaScript (Node.js) | v18+ | Linguagem de execução. |
| **Framework Web**| Express | 5.1.0 | Utilizado para roteamento e controle da API REST. |
| **Banco de Dados**| MySQL | 8.x | Sistema de Gerenciamento de Banco de Dados. |
| **Driver DB** | mysql2 | 3.15.3 | Driver para conexão assíncrona com o MySQL. |

---

## 2. Configuração e Instalação

### 2.1. Requisitos Prévios

* **Node.js** (versão 18 ou superior)
* **MySQL Server** em execução
* Acesso de usuário com permissão para criar banco de dados.

### 2.2. Configuração do Banco de Dados

O projeto utiliza o banco de dados `ecommerce`.

1.  **Crie o Schema no MySQL:**
    ```sql
    CREATE DATABASE ecommerce;
    ```
2.  **Rode o Script de Criação das Tabelas:**
    Execute o script `schema.sql` para garantir que as tabelas `clients`, `products`, `orders` e `order_items` estejam criadas.
3.  **Configure o Pool de Conexões:**
    Ajuste as credenciais no arquivo `server/src/db/pool.js` se elas forem diferentes das credenciais padrão (`root:1234`):
    ```javascript
    const MYSQL_URL = 'mysql://root:1234@localhost:3306/ecommerce'; 
    ```

### 2.3. Instalação do Servidor

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/LeandroOL9/Trabalho-M3-Projeto-de-E-commerce.git]
    cd nome-do-projeto/server
    ```
2.  **Instale as dependências:**
    ```bash
    npm install
    ```
3.  **Inicie o servidor (Modo Desenvolvimento):**
    ```bash
    npm run dev
    ```
    O servidor será iniciado em `http://localhost:3000`.

---

## 3. Endpoints da API

A base de todos os endpoints é `/api`.

### 3.1. Produtos e Catálogo (`/api/products`)

| Método | Caminho | Descrição | Parâmetros (Query) | Status Code |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/import` | **Importa e popula** a tabela `products` com dados da FakeStore API e define o estoque inicial (fixo em 100). | N/A | `200 OK` |
| `GET` | `/` | Lista produtos disponíveis no catálogo. Suporta filtros opcionais. | `category`, `search` | `200 OK` |
| `GET` | `/:id` | Retorna os detalhes de um produto específico, incluindo o estoque atual. | N/A | `200 OK` / `404 Not Found` |

### 3.2. Fluxo de Compra (`/api/cart` e `/api/orders`)

| Método | Caminho | Descrição | Corpo da Requisição (Body) | Status Code |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/cart/validate` | **Valida o estoque** para adição ao carrinho. Consulta o DB para garantir a consistência em tempo real (cenário de concorrência). | `{"productId": INT, "quantity": INT}` | `200 OK` (Suficiente) / `409 Conflict` (Insuficiente) |
| `POST` | `/orders` | **Cria um novo pedido** (checkout). Realiza uma **Transação MySQL** para: revalidar estoque, criar cliente (upsert), criar pedido, criar itens e diminuir o estoque. | `{"client": {"name":..., "email":...}, "items": [{"product_id":..., "quantity":..., "price":...}, ...]}` | `201 Created` (Sucesso) / `409 Conflict` (Falha no Estoque / Rollback) |

### 3.3. Consultar Compras

| Método | Caminho | Descrição | Parâmetros (Rota) | Status Code |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/clients/:email/orders` | Lista todos os pedidos realizados por um cliente, formatando a resposta com data, valor total e a lista de produtos de cada pedido. | `:email` (STRING) | `200 OK` / `404 Not Found` |

---

## 4. Estrutura do Código

O Back-end está organizado em camadas para modularização:

| Módulo | Caminho Relativo | Função Principal |
| :--- | :--- | :--- |
| **Ponto de Entrada** | [server/src/app.js](server/src/app.js) | Configuração do Express e Middlewares. |
| **Rotas** | [server/src/routes](server/src/routes) | Define os endpoints (`productRoutes.js`, `orderRoutes.js`). |
| **Controllers** | [server/src/controllers](server/src/controllers) | Contém a lógica de tratamento das requisições e a resposta HTTP. |
| **Services/Repository** | [server/src/services](server/src/services) | Lógica de acesso ao banco de dados e manipulação de dados (transações, consultas). |
| **Configuração DB** | [server/src/db/pool.js](server/src/db/pool.js) | Cria e gerencia o pool de conexões MySQL. |

## 5. Arquitetura do Frontend (SPA Simplificada) 

O frontend é composto por páginas HTML estáticas (`index.html` e `cart.html`) e lógica em **JavaScript** que se comunica com a API REST do Back-end. Ele simula uma Single Page Application (SPA) na experiência, gerenciando estado do carrinho e navegação por meio do `localStorage` do navegador e recarregamento de componentes DOM.

O front-end é dividido em módulos com responsabilidades específicas:

| Módulo | Arquivos Envolvidos | Função Principal |
| :--- | :--- | :--- |
| **Página Principal (Catálogo)** | `index.html`, `script.js` | Exibe a lista de produtos, permite pesquisa e filtragem por categoria. Contém a lógica de "Minhas Compras". |
| **Página Carrinho** | `cart.html`, `cart.js` | Exibe o conteúdo do carrinho, permite ajustes de quantidade, esvaziar carrinho e iniciar o checkout. |
| **Renderização do Carrinho** | `cartRenderer.js` | Responsável por ler o `localStorage` (`ecom_cart`) e transformar os itens em HTML para exibição na tabela. |
| **Manipulação de Quantidade** | `quantityHandler.js` | Lógica de **aumentar/diminuir** a quantidade de um item no carrinho. **Chama o endpoint de validação (`/api/cart/validate`)** para garantir estoque antes de aumentar. |
| **Checkout** | `checkout.js` | Gerencia o fluxo de finalização da compra: exibe um modal, coleta dados do cliente e **envia a transação para o Back-end (`/api/orders`)**. |
| **Busca de Pedidos** | `myOrders.js` | Lógica no `index.html` para buscar pedidos de um cliente pelo e-mail (`/api/clients/:email/orders`) e renderizar a lista. |
| **Mecanismo de Compra**| `cartSubmitSimple.js` | Lógica inicial (presente no catálogo) que **valida todos os itens do contador** via API (`/api/cart/validate`) e, se tudo estiver OK, salva no `localStorage` e redireciona para `cart.html`. |
| **Categorias** | `categoria.js` | Funções utilitárias para extrair e popular o filtro de categorias na página principal. |

---

## 6. Persistência de Estado (Frontend) 

O estado do carrinho é mantido no **`localStorage`** do navegador.

* `ecom_counts`: Armazena a contagem simples de produtos em exibição no catálogo (`productId: quantity`).
* `ecom_cart`: Armazena a versão **validada** e detalhada dos itens do carrinho (título, preço unitário, imagem, etc.), sendo lida pelo `cartRenderer.js`.

**Fluxo de Adição ao Carrinho (via `index.html`):**

1.  O usuário aumenta o contador no catálogo (`index.html`).
2.  Ao clicar no botão do carrinho, a função em `cartSubmitSimple.js` é acionada.
3.  `cartSubmitSimple.js` **itera sobre todos os itens** com contador > 0 e, para cada um, chama `POST /api/cart/validate` no Back-end.
4.  Se todas as validações forem aprovadas, ele salva o array de produtos validados em `ecom_cart` e redireciona para `cart.html`.

**Fluxo de Ajuste no Carrinho (via `cart.html`):**

1.  O usuário clica em `+` ou `-` na tabela do carrinho.
2.  `quantityHandler.js` é acionado.
    * Para `+`: Ele chama `POST /api/cart/validate` com a nova quantidade desejada. Se o Back-end retornar sucesso, a quantidade é atualizada no `ecom_cart` e `ecom_counts`.
    * Para `-`: A quantidade é diminuída localmente no `ecom_cart` e `ecom_counts` (sem necessidade de validação no Back-end, pois é apenas redução).

---

## 7. Pré-requisitos e Execução do Frontend

Para o frontend funcionar corretamente, o **servidor Node.js (Back-end) deve estar rodando** em `http://localhost:3000`.

1.  Certifique-se de que o Back-end está iniciado (`npm run dev` na pasta `server`).
2.  Abra o arquivo `index.html` (ou utilize uma extensão de Live Server para carregá-lo via `http://`).
3.  Acesse `index.html` para o catálogo e `cart.html` para o carrinho.
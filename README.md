# LabControl - Sistema de Controle de Equipamentos de Laboratório

API REST em **Java 17** e **Spring Boot 3** desenvolvida para o gerenciamento e controle de equipamentos de laboratório, com persistência de dados em **MySQL**.

---

## 🚀 Tecnologias Utilizadas

* **Java 17**
* **Spring Boot 3.x**
  * Spring Web
  * Spring Data JPA
  * Bean Validation
* **MySQL**

---

## 🛠️ Como Executar o Projeto

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/labcontrol.git
   cd labcontrol
   ```

2. **Configurar o Banco de Dados:**
   Crie o banco de dados no MySQL ou ajuste o arquivo `src/main/resources/application.properties` com suas credenciais:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/labcontrol_db?createDatabaseIfNotExist=true
   spring.datasource.username=seu_usuario
   spring.datasource.password=sua_senha
   ```

3. **Executar a aplicação:**
   ```bash
   ./mvnw spring-boot:run
   ```
   A aplicação estará disponível em `http://localhost:8080`.

---

## 📌 Endpoints da API

| Operação | Método | Endpoint | Descrição | Status de Resposta |
| :--- | :--- | :--- | :--- | :--- |
| **Cadastrar** | `POST` | `/equipamentos` | Cadastra um novo equipamento | `201 Created` / `400` / `409` |
| **Listar Todos** | `GET` | `/equipamentos` | Retorna todos os equipamentos | `200 OK` |
| **Buscar por ID**| `GET` | `/equipamentos/{id}` | Busca um equipamento pelo ID | `200 OK` / `404` |
| **Atualizar** | `PUT` | `/equipamentos/{id}` | Atualiza um equipamento existente | `200 OK` / `400` / `404` / `409` |
| **Excluir** | `DELETE` | `/equipamentos/{id}` | Remove um equipamento pelo ID | `204 No Content` / `404` |

---

## 📝 Regras de Negócio e Validações

* **Campos Obrigatórios:** Nome, Número de Patrimônio, Categoria e Quantidade.
* **Nome:** Deve ter entre 3 e 100 caracteres.
* **Quantidade:** Deve ser um número inteiro maior ou igual a 0.
* **Patrimônio Único:** Não é permitido cadastrar ou atualizar dois equipamentos com o mesmo número de patrimônio (Retorna `409 Conflict`).


================================================================================
DOCUMENTO DE REFLEXÃO CRÍTICA - LABCONTROL
================================================================================

1. ARQUITETURA EM CAMADAS E REGRA DE PATRIMÔNIO DUPLICADO
--------------------------------------------------------------------------------
O projeto foi estruturado utilizando uma arquitetura em camadas bem definida para garantir a separação de responsabilidades (SoC - Separation of Concerns):

- Controller (Camada de Apresentação): É responsável exclusivamente por receber as requisições HTTP, validar os dados iniciais através da anotação @Valid, invocar a camada de serviço e retornar as respostas HTTP apropriadas com seus respectivos códigos de status (200, 201, 204, 400, 404, 409).
- Service (Camada de Negócio): Concentra todas as regras de negócio da aplicação. É onde se decide se um dado pode ou não ser persistido com base em lógicas complexas.
- Repository (Camada de Acesso a Dados): Atua como uma ponte direta com o banco de dados MySQL por meio do Spring Data JPA, realizando operações de persistência sem conhecer detalhes de rotas web.
- Model (Camada de Domínio/Entidade): Representa as tabelas do banco de dados e aplica as restrições de integridade estrutural (como tamanho de caracteres e campos obrigatórios).

Por que a regra do patrimônio duplicado ficou na Service?
A regra que impede o cadastro ou atualização de dois equipamentos com o mesmo número de patrimônio pertence à lógica de negócio da aplicação. Mantê-la na camada Service garante que o Controller permaneça "magro" (focado apenas no protocolo HTTP) e que o Repository foque apenas em consultas. Além disso, centralizar essa validação na Service permite que ela seja reutilizada por diferentes pontos de entrada (seja uma API REST, um CLI ou mensageria) sem duplicação de código.


2. VERBOS HTTP E BANCO DE DADOS
--------------------------------------------------------------------------------
A API REST implementa a correta correspondência entre as requisições web e as operações executadas no banco de dados MySQL:

- POST (/equipamentos): 
  * Operação SQL: INSERT.
  * Comportamento: Cadastra um novo registro.
  * Status HTTP Retornado: 201 Created (com o JSON do equipamento criado) ou 400 Bad Request em caso de dados inválidos, ou 409 Conflict se o patrimônio já existir.

- GET (/equipamentos): 
  * Operação SQL: SELECT.
  * Comportamento: Recupera a lista completa de registros.
  * Status HTTP Retornado: 200 OK (com o array JSON).

- GET (/equipamentos/{id}): 
  * Operação SQL: SELECT ... WHERE id = ?.
  * Comportamento: Busca um registro específico pelo seu identificador único.
  * Status HTTP Retornado: 200 OK (com o objeto JSON) ou 404 Not Found caso o ID não exista no banco.

- PUT (/equipamentos/{id}): 
  * Operação SQL: UPDATE.
  * Comportamento: Atualiza os dados de um registro existente.
  * Status HTTP Retornado: 200 OK (com o JSON atualizado), 404 Not Found se o ID não for encontrado, ou 409 Conflict se houver colisão de patrimônio com outro item.

- DELETE (/equipamentos/{id}): 
  * Operação SQL: DELETE.
  * Comportamento: Remove o registro correspondente do banco.
  * Status HTTP Retornado: 204 No Content em caso de sucesso, ou 404 Not Found se o ID informado não existir.


3. VALIDAÇÃO NO BACK-END E SEGURANÇA (SQL INJECTION)
--------------------------------------------------------------------------------
- Importância da validação no back-end:
Embora o front-end realize validações visuais para melhorar a experiência do usuário, ele roda no lado do cliente e pode ser facilmente burlado ou ignorado através de ferramentas de testes de API (como Postman ou cURL), scripts diretos ou interceptadores de rede. O back-end é a última e mais importante linha de defesa para assegurar que nenhum dado corrompido, incompleto ou malicioso seja gravado no banco de dados.

- Prevenção contra SQL Injection com JPA/Spring Data:
Em sistemas legados que concatenam strings diretamente para formar comandos SQL, invasores podem injetar comandos maliciosos nos inputs para manipular ou apagar o banco de dados (SQL Injection). O Spring Data JPA resolve esse problema estruturalmente ao utilizar consultas parametrizadas por padrão através de PreparedStatements. Quando o sistema executa métodos como findById ou consultas derivadas, os valores enviados pelos usuários são tratados estritamente como parâmetros de dados, e nunca como trechos executáveis de código SQL, neutralizando completamente esse vetor de ataque.

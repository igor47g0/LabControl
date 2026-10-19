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

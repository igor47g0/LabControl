<div align="center">
  <img src="docs/images/logo.png" alt="LabControl Logo" width="620">

  <p><strong>Sistema Inteligente de Controle & Gestão de Equipamentos de Laboratório</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Java-17%2B-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java 17+">
    <img src="https://img.shields.io/badge/Spring_Boot-3.3.4-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white" alt="Spring Boot 3.3.4">
    <img src="https://img.shields.io/badge/Spring_Data_JPA-Hibernate-6DB33F?style=for-the-badge&logo=hibernate&logoColor=white" alt="Spring Data JPA">
    <img src="https://img.shields.io/badge/MySQL-5.7%20%7C%208.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL">
    <img src="https://img.shields.io/badge/Swagger-OpenAPI_3-85EA2D?style=for-the-badge&logo=swagger&logoColor=black" alt="Swagger OpenAPI 3">
    <img src="https://img.shields.io/badge/Tests-21%20Passed-brightgreen?style=for-the-badge&logo=junit5&logoColor=white" alt="Tests 21 Passed">
  </p>

  <p>
    Repositório Oficial: <a href="https://github.com/igor47g0/LabControl"><strong>https://github.com/igor47g0/LabControl</strong></a>
  </p>
</div>

---

## 📌 Sumário
1. [Sobre o Projeto](#-sobre-o-projeto)
2. [Estrutura do Projeto](#-estrutura-do-projeto)
3. [Regras de Negócio e Validações](#-regras-de-negócio-e-validações)
4. [Mapeamento dos Endpoints (CRUD)](#-mapeamento-dos-endpoints-crud)
5. [Tratamento de Exceções & Respostas HTTP](#-tratamento-de-exceções--respostas-http)
6. [Landing Page & Dashboard Integrado](#-landing-page--dashboard-integrado)
7. [Como Executar a Aplicação](#-como-executar-a-aplicação)
8. [Exemplos de Requisição (cURL)](#-exemplos-de-requisição-curl)
9. [Suíte de Testes Automatizados](#-suíte-de-testes-automatizados)

---

## 🔬 Sobre o Projeto

O **LabControl** é uma API REST corporativa desenvolvida em **Java 17+** com **Spring Boot 3.x**, **Spring Data JPA**, **Spring Validation (Bean Validation)** e **MySQL Driver**. O sistema gerencia o inventário de equipamentos analíticos e laboratoriais com garantias estritas de integridade de dados, unicidade de patrimônio e retorno padronizado de códigos HTTP.

O projeto inclui ainda uma **Landing Page completa com SPA (Single Page Application)** servida diretamente pela aplicação em `http://localhost:8080/`, com dashboard em tempo real, painel interativo de CRUD, métricas de estoque, documentação de endpoints e integração com o **Swagger UI**.

---

## 📁 Estrutura do Projeto

O projeto foi dividido rigorosamente de acordo com as camadas e convenções exigidas:

```text
LabControl/
├── pom.xml                                      # Dependências (Spring Boot 3.3.4, JPA, Validation, MySQL, OpenAPI, H2)
├── src/
│   ├── main/
│   │   ├── java/com/labcontrol/
│   │   │   ├── LabControlApplication.java       # Classe principal Spring Boot
│   │   │   ├── model/
│   │   │   │   └── Equipamento.java             # Entidade JPA com validações Bean Validation
│   │   │   ├── repository/
│   │   │   │   └── EquipamentoRepository.java   # JpaRepository com métodos de patrimônio único
│   │   │   ├── service/
│   │   │   │   └── EquipamentoService.java      # Camada de regras de negócio e integridade
│   │   │   ├── controller/
│   │   │   │   └── EquipamentoController.java   # Controller REST com CRUD completo
│   │   │   └── exception/
│   │   │       ├── ResourceNotFoundException.java # 404 Not Found
│   │   │       ├── ConflictException.java         # 409 Conflict
│   │   │       ├── ErrorResponse.java             # DTO de formatação padronizada de erros
│   │   │       └── GlobalExceptionHandler.java    # @RestControllerAdvice (400, 404, 409, 500)
│   │   └── resources/
│   │       ├── application.properties           # Conexão MySQL (labcontrol_db), Hibernate e Swagger
│   │       └── static/                          # Landing Page & Dashboard Web
│   │           ├── index.html                   # Interface Web Responsiva
│   │           ├── css/styles.css               # Folha de estilo dark-tech moderna
│   │           ├── js/app.js                    # Cliente REST em JavaScript para testes em tempo real
│   │           └── images/                      # Logotipo SVG/PNG e ilustrações
│   └── test/
│       ├── java/com/labcontrol/
│       │   ├── controller/
│       │   │   └── EquipamentoControllerTest.java # Testes MockMvc (201, 200, 204, 400, 404, 409)
│       │   └── service/
│       │       └── EquipamentoServiceTest.java    # Testes unitários com Mockito
│       └── resources/
│           └── application.properties           # Banco H2 em memória para testes isolados
```

---

## 📋 Regras de Negócio e Validações

Cada equipamento é composto pelos seguintes atributos:

| Campo | Tipo | Validações Bean Validation / JPA | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `Long` | `@Id`, `@GeneratedValue(IDENTITY)` | Gerado automaticamente pelo banco de dados |
| `nome` | `String` | `@NotBlank`, `@Size(min = 3, max = 100)` | Obrigatório, tamanho entre 3 e 100 caracteres |
| `numeroPatrimonio` | `String` | `@NotBlank`, `@Column(unique = true)` | Obrigatório e estritamente único no sistema |
| `categoria` | `String` | `@NotBlank` | Categoria analítica obrigatória |
| `quantidade` | `Integer` | `@NotNull`, `@Min(0)` | Número inteiro maior ou igual a zero |

### Regras Específicas:
1. **Unicidade no Cadastro**: Antes de persistir um novo equipamento, o serviço consulta `existsByNumeroPatrimonio`. Caso já exista, interrompe a requisição com **HTTP 409 Conflict**.
2. **Unicidade na Atualização**: Ao alterar um equipamento, o serviço consulta `existsByNumeroPatrimonioAndIdNot`. Se o patrimônio informado pertencer a outro equipamento, lança **HTTP 409 Conflict**.
3. **Existência de Identificador**: Buscas, alterações ou exclusões de IDs não cadastrados disparam `ResourceNotFoundException`, resultando em **HTTP 404 Not Found**.
4. **Validação de Entrada**: Qualquer campo em desacordo com as anotações do Bean Validation (ex.: quantidade negativa, nome curto, campos em branco) gera **HTTP 400 Bad Request** com os detalhes dos campos incorretos.

---

## 🚀 Mapeamento dos Endpoints (CRUD)

| Método | Endpoint | Descrição | Sucesso | Erros Mapeados |
| :---: | :--- | :--- | :---: | :---: |
| `POST` | `/equipamentos` | Cadastrar novo equipamento | `201 Created` | `400 Bad Request`, `409 Conflict` |
| `GET` | `/equipamentos` | Listar todos os equipamentos | `200 OK` | - |
| `GET` | `/equipamentos/{id}` | Buscar equipamento por ID | `200 OK` | `404 Not Found`, `400 Bad Request` |
| `PUT` | `/equipamentos/{id}` | Atualizar equipamento por ID | `200 OK` | `400 Bad Request`, `404 Not Found`, `409 Conflict` |
| `DELETE` | `/equipamentos/{id}` | Excluir equipamento por ID | `204 No Content` | `404 Not Found`, `400 Bad Request` |

---

## 🛡️ Tratamento de Exceções & Respostas HTTP

O `@RestControllerAdvice` padroniza o JSON de erro com carimbo de data/hora (`timestamp`), código HTTP (`status`), descrição (`error`), mensagem explicativa (`message`), URI da chamada (`path`) e mapa detalhado de campos inválidos (`fieldErrors`):

```json
{
  "timestamp": "2026-10-19T19:40:00",
  "status": 400,
  "error": "Bad Request",
  "message": "O nome deve ter entre 3 e 100 caracteres",
  "path": "/equipamentos",
  "fieldErrors": {
    "nome": "O nome deve ter entre 3 e 100 caracteres",
    "quantidade": "A quantidade deve ser maior ou igual a 0"
  }
}
```

---

## 💻 Landing Page & Dashboard Integrado

Ao iniciar a aplicação, acesse no navegador:

- **Landing Page & CRUD Live**: `http://localhost:8080/`
- **Swagger UI (OpenAPI 3)**: `http://localhost:8080/swagger-ui.html`
- **Documentação OpenAPI JSON**: `http://localhost:8080/api-docs`

A interface permite:
- Criar, listar, editar e excluir equipamentos visualmente.
- Filtrar equipamentos em tempo real por nome, patrimônio e categoria.
- Painel com contadores de estoque, itens críticos e total de categorias.
- Visualização do JSON bruto retornado por cada item.

---

## ⚙️ Como Executar a Aplicação

### 1. Pré-requisitos
- **Java 17** ou superior (Java 21 recomendado)
- **Maven 3.8+**
- **MySQL Server 5.7+** ou **8.0+**

### 2. Configurar o Banco de Dados MySQL
No seu terminal MySQL ou Workbench, crie a base de dados:
```sql
CREATE DATABASE IF NOT EXISTS labcontrol_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

As credenciais padrão no `application.properties` são:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/labcontrol_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:root}
```
*(Caso seu usuário ou senha sejam diferentes, você pode passar variáveis de ambiente `DB_USERNAME` e `DB_PASSWORD` ou editá-las no arquivo).*

### 3. Compilar e Executar
No diretório raiz do projeto:
```bash
# Executar a aplicação
mvn spring-boot:run
```
Ou utilizando o arquivo JAR gerado:
```bash
mvn clean package -DskipTests
java -jar target/labcontrol-1.0.0.jar
```

---

## 📡 Exemplos de Requisição (cURL)

### 1. Cadastrar Equipamento (POST)
```bash
curl -X POST http://localhost:8080/equipamentos \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Espectrofotômetro UV-Vis",
    "numeroPatrimonio": "PAT-10001",
    "categoria": "Espectrometria",
    "quantidade": 3
  }'
```

### 2. Listar Todos (GET)
```bash
curl -X GET http://localhost:8080/equipamentos
```

### 3. Buscar por ID (GET)
```bash
curl -X GET http://localhost:8080/equipamentos/1
```

### 4. Atualizar Equipamento (PUT)
```bash
curl -X PUT http://localhost:8080/equipamentos/1 \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Espectrofotômetro UV-Vis Dual Beam",
    "numeroPatrimonio": "PAT-10001",
    "categoria": "Espectrometria Avançada",
    "quantidade": 4
  }'
```

### 5. Excluir Equipamento (DELETE)
```bash
curl -X DELETE http://localhost:8080/equipamentos/1
```

---

## 🧪 Suíte de Testes Automatizados

O projeto conta com **21 testes automatizados** cobrindo todos os cenários de sucesso e falha (400, 404, 409):
- **10 Testes Unitários de Serviço** (`EquipamentoServiceTest`) com Mockito.
- **11 Testes de Integração de Controlador** (`EquipamentoControllerTest`) com Spring MockMvc.

Para rodar os testes:
```bash
mvn test
```

Resultado da execução:
```text
[INFO] Running com.labcontrol.controller.EquipamentoControllerTest
[INFO] Tests run: 11, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.labcontrol.service.EquipamentoServiceTest
[INFO] Tests run: 10, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] Results:
[INFO] Tests run: 21, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

---

## 👨‍💻 Autor & Repositório

- **Repositório GitHub**: [igor47g0/LabControl](https://github.com/igor47g0/LabControl)
- **Projeto Avaliativo**: Sistema de Gerenciamento e Controle de Equipamentos Laboratoriais

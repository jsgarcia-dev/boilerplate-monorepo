# Documentação do Projeto Revitalize Monorepo

## Introdução

Este documento fornece uma visão detalhada do projeto **BoilerPlate Monorepo**, incluindo a lógica por trás de sua criação, instruções sobre como configurar e executar o banco de dados usando **Docker Compose**, explicação sobre a pasta `generated` no pacote `db`, e orientações para construir e iniciar o projeto corretamente.

## Sumário

1.  [Estrutura do Projeto](#estrutura)
2.  [Configuração Inicial do Projeto](#configuracao-inicial)
3.  [Configuração do Banco de Dados com Docker Compose](#configuracao-banco)
4.  [Integração com Prisma](#prisma)
5.  [Configuração do Turborepo](#turbo)
6.  [Scripts e Execução do Projeto](#scripts)
7.  [Explicação da Pasta `generated`](#pasta-generated)
8.  [Conclusão](#conclusao)

## 1\. Estrutura do Projeto

O projeto é um monorepo gerenciado pelo **PNPM Workspaces** e **Turborepo**, composto pelos seguintes pacotes e aplicativos:

## 1\. Técnologias Utilizadas

- **Next.js 14**: Framework para construção de aplicações web.
- **Nest.js**: Framework para construção de APIs.
- **Turborepo**: Gerenciamento de tarefas e dependências entre os pacotes do monorepo.
- **PNPM Workspaces**: Gerenciamento de dependências e pacotes em um monorepo.
- **Docker Compose**: Gerenciamento de contêineres Docker.
- **Prisma**: ORM para integração com bancos de dados.

- **apps/web**: Aplicação web construída com Next.js.
- **apps/api**: API construída com Nest.js.
- **packages/db**: Pacote responsável pela integração com o banco de dados, usando Prisma.
- **packages/ui**: Biblioteca de componentes de interface reutilizáveis (opcional).
- **packages/eslint-config**, **packages/typescript-config**: Configurações compartilhadas para ESLint e TypeScript.

## 2\. Configuração Inicial do Projeto

### Configuração das Aplicações

---

### Configurando o Docker Compose

Criar um arquivo `docker-compose.yml` na raiz do projeto para configurar o banco de dados PostgreSQL:

    version: "3.7"

    services:
      pg:
        image: bitnami/postgresql:latest
        ports:
          - "5432:5432"
        environment:
          - POSTGRES_USER=docker
          - POSTGRES_PASSWORD=docker
          - POSTGRES_DB="seu_banco_aqui"

Este arquivo configura um serviço PostgreSQL usando a imagem do Bitnami, expondo a porta 5432 e definindo variáveis de ambiente para o usuário, senha e nome do banco de dados.

### Subindo o Banco de Dados

Na raiz do projeto, execute o comando:

    docker-compose up -d

Isso iniciará o serviço do PostgreSQL em segundo plano. Você pode verificar se o banco de dados está rodando com:

    docker ps

## 3\. Integração com Prisma

### 4.1. Configurando o Prisma no Pacote `db`

Instale o Prisma e o cliente Prisma no pacote `packages/db`:

    cd packages/db
    pnpm add prisma @prisma/client

Inicialize o Prisma:

    npx prisma init --datasource-provider postgresql

Isso criará o arquivo `prisma/schema.prisma` e o arquivo de ambiente `.env`.

### 4.2. Configurando a URL do Banco de Dados

No arquivo `packages/db/.env`, defina a variável `DATABASE_URL`:

    DATABASE_URL="postgresql://docker:docker@localhost:5432/seu_banco_aqui?schema=public"

### 4.3. Definindo o Esquema Prisma

No arquivo `prisma/schema.prisma`, defina os modelos do banco de dados. Exemplo:

    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }

    generator client {
      provider = "prisma-client-js"
      output   = "../generated" // Especifica que o cliente será gerado na pasta "generated"
    }

    // Modelo de exemplo
    model User {
      id    Int    @id @default(autoincrement())
      name  String
      email String @unique
    }

### 4.4. Aplicando Migrações

Para sincronizar o esquema com o banco de dados, execute:

    pnpm prisma db push

Isso aplicará as mudanças do esquema ao banco de dados sem criar uma migração. Para criar uma migração, use:

    pnpm prisma migrate dev --name init

### 4.5. Gerando o Cliente Prisma

Para gerar o cliente Prisma, execute:

    pnpm prisma generate

Isso gerará o cliente na pasta `packages/db/prisma/generated`.

## 5\. Configuração do Turborepo

O Turborepo é usado para gerenciar tarefas e dependências entre os pacotes do monorepo.

### 5.1. Arquivo `turbo.json`

Na raiz do projeto, crie o arquivo `turbo.json` com o seguinte conteúdo:

    {
      "$schema": "https://turbo.build/schema.json",
      "ui": "tui",
      "globalDependencies": ["NODE_ENV"],
      "tasks": {
        "build": {
          "dependsOn": ["^build", "db:generate"],
          "inputs": ["$TURBO_DEFAULT$", ".env*"],
          "outputs": [".next/**", "!.next/cache/**", "dist/**"]
        },
        "start": {
          "dependsOn": ["build"],
          "cache": false
        },
        "lint": {
          "dependsOn": ["^lint"]
        },
        "dev": {
          "cache": false,
          "persistent": true,
          "dependsOn": ["db:generate"]
        },
        "db:generate": {
          "cache": false
        },
        "db:push": {
          "cache": false
        }
      }
    }

Isso configura as tarefas que o Turborepo irá gerenciar, garantindo que as dependências sejam respeitadas e que o `prisma generate` seja executado antes de builds que necessitem dele.

## 6\. Scripts e Execução do Projeto

### 6.1. Scripts na Raiz do Projeto

No arquivo `package.json` na raiz do projeto, defina os seguintes scripts:

    {
      "scripts": {
        "build": "turbo run build",
        "dev": "turbo run dev --parallel",
        "start": "turbo run start --parallel",
        "lint": "turbo run lint",
        "format": "turbo run format",
        "db:generate": "turbo run db:generate",
        "db:push": "turbo run db:push"
      }
    }

### 6.2. Scripts nos Pacotes Individuais

#### 6.2.1. Pacote `db`

No arquivo `packages/db/package.json`:

    {
      "name": "@repo/db",
      "version": "1.0.0",
      "private": true,
      "scripts": {
        "db:generate": "prisma generate",
        "db:push": "prisma db push"
      },
      "dependencies": {
        "@prisma/client": "^5.20.0"
      },
      "devDependencies": {
        "prisma": "^5.20.0"
      }
    }

#### 6.2.2. Aplicação Web (`apps/web`)

No arquivo `apps/web/package.json`:

    {
      "name": "web",
      "version": "0.1.0",
      "private": true,
      "scripts": {
        "build": "next build",
        "start": "next start",
        "dev": "next dev",
        "lint": "next lint"
      },
      "dependencies": {
        "@repo/db": "*",
        "next": "13.5.2",
        "react": "18.2.0",
        "react-dom": "18.2.0"
      },
      "devDependencies": {
        "@types/node": "18.15.11",
        "@types/react": "18.0.38",
        "@types/react-dom": "18.0.11",
        "typescript": "^5.4.5"
      }
    }

#### 6.2.3. API (`apps/api`)

No arquivo `apps/api/package.json`:

    {
      "name": "api",
      "version": "0.1.0",
      "private": true,
      "scripts": {
        "build": "nest build",
        "start": "node dist/main.js",
        "dev": "nest start --watch",
        "lint": "nest lint"
      },
      "dependencies": {
        "@nestjs/common": "^10.2.3",
        "@nestjs/core": "^10.2.3",
        "@repo/db": "*",
        "reflect-metadata": "^0.1.13",
        "rxjs": "^7.8.1"
      },
      "devDependencies": {
        "@nestjs/cli": "^10.2.3",
        "@nestjs/schematics": "^10.1.3",
        "@nestjs/testing": "^10.2.3",
        "typescript": "^5.4.5"
      }
    }

### 6.3. Execução das Tarefas

#### 6.3.1. Instalar as Dependências

Na raiz do projeto, instale todas as dependências:

    pnpm install

#### 6.3.2. Sincronizar o Banco de Dados

Para sincronizar o esquema do Prisma com o banco de dados:

    pnpm db:push

#### 6.3.3. Gerar o Cliente Prisma

Gerar o cliente Prisma:

    pnpm db:generate

#### 6.3.4. Construir o Projeto

Para construir todos os pacotes:

    pnpm build

#### 6.3.5. Iniciar as Aplicações em Modo de Produção

Iniciar as aplicações utilizando o build:

    pnpm start

Isso irá iniciar as aplicações `web` e `api` em paralelo, utilizando os arquivos de build gerados.

## 7\. Explicação da Pasta `generated`

A pasta `generated` dentro do pacote `packages/db/prisma` é onde o Prisma gera automaticamente o cliente baseado no seu esquema definido em `schema.prisma`. Esta pasta não deve ser versionada no controle de versão (Git), pois os arquivos gerados podem ser reconstruídos a qualquer momento a partir do esquema.

### 7.1. Atualização do `.gitignore`

Para evitar que a pasta `generated` seja incluída no repositório, adicione a seguinte linha ao arquivo `.gitignore` na raiz do projeto:

    /packages/db/prisma/generated/

Isso garante que os arquivos gerados pelo Prisma não sejam incluidos no controle de versão, evitando conflitos e reduzindo o tamanho do repositório.

## 8\. Conclusão

Este documento detalhou toda a lógica e passos realizados desde a criação do projeto Revitalize Monorepo, incluindo a configuração do banco de dados com Docker Compose, integração com o Prisma, uso do Turborepo para gerenciar tarefas, e explicação sobre a pasta `generated`. Com estas informações, é possível entender o funcionamento do projeto e como executar e desenvolver sobre ele.

## Referências

- [Documentação do PNPM](https://pnpm.io/pt/)
- [Documentação do Turborepo](https://turbo.build/repo)
- [Docker](https://www.docker.com/)
- [Documentação do Prisma](https://www.prisma.io/docs/)
- [Documentação do Next.js](https://nextjs.org/docs)
- [Documentação do Nest.js](https://docs.nestjs.com/)

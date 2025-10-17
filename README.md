# TodoList Backend

Node.js와 Express를 기반으로 한 Todo List 애플리케이션의 백엔드 API 서버입니다.

## 📋 목차

- [기술 스택](#기술-스택)
- [설치 방법](#설치-방법)
- [환경 설정](#환경-설정)
- [데이터베이스 설정](#데이터베이스-설정)
- [실행 방법](#실행-방법)
- [개발 스크립트](#개발-스크립트)
- [참고사항](#참고사항)

## 🛠 기술 스택

- **Runtime**: Node.js
- **Framework**: Express 5.x
- **Database**: MariaDB (MySQL2)
- **Authentication**: JWT (JSON Web Token)
- **Validation**: Express Validator
- **Security**: crypto (PBKDF2 password hashing)
- **Development Tools**:
  - ESLint (코드 품질)
  - Prettier (코드 포맷팅)
  - Nodemon (개발 서버 자동 재시작)

## 📦 설치 방법

### 1. 저장소 클론

```bash
git clone https://github.com/bhy304/todolist-be.git
cd todolist-be
```

### 2. 의존성 설치

```bash
npm install
```

## ⚙️ 환경 설정

프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# 데이터베이스 설정
DB_HOST=localhost
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_DATABASE=your_database_name

# 서버 포트 (선택사항, 기본값: 8080)
PORT=8080

# JWT 시크릿 키
JWT_SECRET=your_jwt_secret_key
```

## 🗄️ 데이터베이스 설정

MariaDB 또는 MySQL 데이터베이스에 다음 테이블을 생성하세요:

## 🚀 실행 방법

### 개발 모드

```bash
npm run dev
```

개발 모드에서는 Nodemon을 사용하여 파일 변경 시 자동으로 서버가 재시작됩니다.

### 프로덕션 모드

```bash
npm start
```

서버는 기본적으로 `http://localhost:8080`에서 실행됩니다.


## 🔧 개발 스크립트

```bash
# 서버 시작 (프로덕션)
npm start

# 서버 시작 (개발 모드)
npm run dev
```

## 📝 참고사항

- 프론트엔드는 기본적으로 `http://localhost:3000`에서 실행되도록 CORS가 설정되어 있습니다
- 다른 도메인을 사용하는 경우 `app.js`의 CORS 설정을 수정하세요

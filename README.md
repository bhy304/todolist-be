# Todo List Backend API

Node.js와 Express를 기반으로 한 Todo List 애플리케이션의 백엔드 API 서버입니다.

## 📋 목차

- [기술 스택](#기술-스택)
- [주요 기능](#주요-기능)
- [설치 방법](#설치-방법)
- [환경 설정](#환경-설정)
- [데이터베이스 설정](#데이터베이스-설정)
- [실행 방법](#실행-방법)
- [API 엔드포인트](#api-엔드포인트)
- [개발 스크립트](#개발-스크립트)

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

## ✨ 주요 기능

- ✅ 사용자 회원가입 및 로그인
- ✅ JWT 기반 인증
- ✅ PBKDF2를 이용한 안전한 비밀번호 해싱
- ✅ CORS 설정으로 프론트엔드 연동 지원
- ✅ 입력 데이터 유효성 검증
- ✅ MariaDB 데이터베이스 연결

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

### Users 테이블

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  salt VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Todos 테이블

```sql
CREATE TABLE todos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

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

## 📡 API 엔드포인트

### 인증 (Authentication)

#### 회원가입

- **URL**: `POST /users/join`
- **Request Body**:
  ```json
  {
    "username": "사용자명",
    "password": "비밀번호"
  }
  ```
- **Response**:
  - 성공: `201 Created`
  - 실패: `400 Bad Request`

#### 로그인

- **URL**: `POST /users/login`
- **Request Body**:
  ```json
  {
    "username": "사용자명",
    "password": "비밀번호"
  }
  ```
- **Response**:
  - 성공: `200 OK`
    ```json
    {
      "message": "로그인되었습니다."
    }
    ```
  - 실패: `401 Unauthorized`
    ```json
    {
      "message": "아이디 또는 비밀번호가 틀렸습니다."
    }
    ```

### Todo 관리

> 🚧 Todo CRUD 엔드포인트는 현재 개발 중입니다.

## 🔧 개발 스크립트

```bash
# 서버 시작 (프로덕션)
npm start

# 서버 시작 (개발 모드)
npm run dev

# 코드 린트 검사
npm run lint

# 코드 린트 자동 수정
npm run lint:fix

# 코드 포맷팅
npm run format
```

## 🔐 보안

- 비밀번호는 PBKDF2 알고리즘으로 해싱되어 저장됩니다
- JWT 토큰은 HttpOnly 쿠키로 전달되어 XSS 공격을 방지합니다
- CORS 설정으로 허용된 도메인에서만 API 접근이 가능합니다

## 📝 참고사항

- 프론트엔드는 기본적으로 `http://localhost:3000`에서 실행되도록 CORS가 설정되어 있습니다
- 다른 도메인을 사용하는 경우 `app.js`의 CORS 설정을 수정하세요

## 📄 라이센스

ISC

## 🔗 링크

- Repository: https://github.com/bhy304/todolist-be
- Issues: https://github.com/bhy304/todolist-be/issues

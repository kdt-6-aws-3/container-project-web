# PetClinic React WEB

Apache가 React 화면을 제공하고, 브라우저의 `/api/*` 요청만 내부 ALB를 통해 WAS(Spring Boot)로 전달합니다. API 요청 형식은 팀의 최신 API 명세를 따릅니다.

## 로컬 실행

```powershell
npm install
npm run dev
```

화면: `http://localhost:5173/`

개발 서버는 `/api/*`를 환경 변수 `VITE_API_TARGET`(기본값 `http://localhost:8080`)으로 프록시합니다. 다른 WAS를 쓰려면 실행할 때 주소를 넘깁니다. 예: `VITE_API_TARGET=http://<WAS 주소>:8080 npm run dev` (PowerShell은 `$env:VITE_API_TARGET="http://<WAS 주소>:8080"; npm run dev`). 팀 WAS가 실행 중이어야 보호자·반려동물·방문 기록·수의사 데이터가 표시됩니다. 예시 데이터나 브라우저 저장 모드는 없습니다. WAS가 준비되지 않았다면 API 화면에 연결 오류가 표시됩니다.

## Apache 배포

```powershell
npm run build
```

`dist` **안의 파일**을 Apache의 `/var/www/html/`에 배치합니다. Apache의 `/api/` 프록시 대상은 내부 ALB DNS와 실제 리스너 포트로 지정합니다.

```apache
ProxyPass        "/api/" "http://INTERNAL-ALB-DNS:8080/api/"
ProxyPassReverse "/api/" "http://INTERNAL-ALB-DNS:8080/api/"
```

기존 `/petclinic/` 전체를 WAS로 보내는 ProxyPass 규칙은 현재 React 화면과 맞지 않으므로 제거해야 합니다. 내부 ALB는 WAS의 `/actuator/health`를 대상 그룹 헬스 체크 경로로 사용할 수 있습니다.

## Docker 이미지로 실행 (GHCR)

Apache 대신 nginx로 React 빌드 결과를 제공하는 이미지입니다. `/api/*`는 nginx가 WAS로 전달합니다. `linux/amd64`(EC2)와 `linux/arm64`(Apple Silicon)가 모두 들어 있습니다.

| 항목 | 값 |
| --- | --- |
| 이미지 | `ghcr.io/kdt-6-aws-3/middle-project-web:0.0.1` |
| 패키지 페이지 | <https://github.com/orgs/kdt-6-aws-3/packages/container/package/middle-project-web> |
| 컨테이너 포트 | 80 (헬스 체크 `/index.html`) |
| 환경 변수 | `WAS_HOST`(기본값 `was`), `WAS_PORT`(기본값 `8080`) — 기동할 때 nginx 설정에 들어갑니다 |

### 1. 레지스트리 로그인

패키지가 private이라 먼저 로그인합니다. 비밀번호 자리에는 `read:packages` 권한이 있는 Personal access token(classic)을 넣습니다.

```bash
docker login ghcr.io -u <GitHub 사용자명>
```

### 2. 받기와 실행

```bash
docker pull ghcr.io/kdt-6-aws-3/middle-project-web:0.0.1
docker run -d --name petclinic-web -p 8090:80 \
  -e WAS_HOST=<WAS 주소 또는 내부 ALB DNS> -e WAS_PORT=8080 \
  ghcr.io/kdt-6-aws-3/middle-project-web:0.0.1
```

화면: `http://localhost:8090/`

- 같은 PC에서 WAS를 Docker로 띄웠다면 두 컨테이너를 같은 네트워크에 두고 `WAS_HOST`에 WAS 컨테이너 이름을 넣습니다.

  ```bash
  docker network create petclinic
  docker run -d --name was --network petclinic -e SPRING_PROFILES_ACTIVE=default ghcr.io/kdt-6-aws-3/middle-project-was:0.0.1
  docker run -d --name web --network petclinic -p 8090:80 -e WAS_HOST=was ghcr.io/kdt-6-aws-3/middle-project-web:0.0.1
  ```

- WAS를 컨테이너 밖(호스트)에서 실행 중이면 `-e WAS_HOST=host.docker.internal`을 씁니다(Docker Desktop 기준).
- `/api/`에는 IP당 초당 30건(순간 50건)의 요청 제한이 걸려 있습니다.

### 3. 확인

```bash
docker ps --filter name=petclinic-web   # STATUS에 (healthy)가 보이면 정상
curl -i http://localhost:8090/api/owners
```

응답 헤더의 `X-Trace-Id`로 같은 요청의 WAS 로그를 찾을 수 있습니다. 화면에서 난 오류는 `/api/client-errors`로 WAS에 보고되어 WAS 로그에 남습니다.

### 새 버전 올리기

`write:packages` 권한으로 로그인한 뒤, 레포 루트에서 버전을 올려 푸시합니다. 버전은 시맨틱 버전(`MAJOR.MINOR.PATCH`)을 따르고 이미 올린 태그는 덮어쓰지 않습니다.

```bash
docker buildx build --platform linux/amd64,linux/arm64 \
  --label org.opencontainers.image.source=https://github.com/kdt-6-aws-3/middle-project-web \
  -t ghcr.io/kdt-6-aws-3/middle-project-web:<버전> --push .
```

## WEB 가용 영역과 인스턴스 ID 표시

React 화면 하단에는 현재 HTML을 제공한 WEB EC2의 가용 영역과 인스턴스 ID를 표시할 수 있습니다. 빌드된 `index.html`에는 빈 `web-availability-zone`, `web-instance-id` 메타 태그가 들어 있습니다. EC2에서 배포 파일을 복사한 뒤 다음 스크립트로 해당 인스턴스의 값을 넣습니다. 스크립트는 IMDSv2를 사용하며 인터넷이나 AWS CLI가 필요하지 않습니다.

```bash
sudo install -m 755 scripts/set-web-az.sh /usr/local/bin/set-web-az
sudo /usr/local/bin/set-web-az /var/www/html/index.html
```

ASG용 AMI를 만들 때는 작업용 EC2에서 시험한 다음 `sudo cp dist/index.html /var/www/html/index.html`로 메타 태그 값을 다시 비워 둡니다. 설치한 스크립트와 새 React 빌드 파일을 AMI에 포함하고, 시작 템플릿의 **기존 사용자 데이터**에 `sudo /usr/local/bin/set-web-az /var/www/html/index.html` 명령을 추가합니다. 기존 사용자 데이터에 이 명령이 이미 있다면 변경할 필요가 없습니다. 새로운 인스턴스마다 실행해야 하며, React 파일을 다시 배포해 `index.html`이 덮어써졌을 때도 재실행합니다. 작업용 퍼블릭 EC2에서 넣은 값을 AMI에 그대로 저장하면 프라이빗 WEB 인스턴스의 가용 영역과 ID가 다를 수 있습니다.

## 지원 화면

- 보호자 검색·페이지 이동·등록·수정·삭제·상세 조회
- 반려동물 등록·수정·삭제 및 방문 기록 등록·수정·삭제
- 병원별 수의사 목록과 전문 분야
- 진료 예약 목록·상세·등록·변경·상태 변경·삭제 (병원·수의사·반려동물·상태별 조회)

보호자 등록·수정은 새 명세의 `name`, `address`, `phone` 필드를 전송합니다. 전화번호는 `010-1234-5678`처럼 하이픈을 포함해 입력합니다. 서버의 검증 오류는 Problem Details의 메시지로 표시합니다.

반려동물 이름은 같은 보호자 안에서도 중복할 수 있습니다. 화면은 이름이 아닌 반려동물 ID로 상세 조회와 수정을 구분합니다.

예약 일시는 서울 시간 기준 `yyyy-MM-ddTHH:mm:ss` 형식으로 API에 전송합니다. 새 예약은 요청 상태로 생성됩니다. 취소·완료된 예약은 변경할 수 없으며, 보호자나 반려동물을 삭제하면 연결된 예약도 함께 삭제됩니다.

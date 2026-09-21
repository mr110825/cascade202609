# Cascade

学習ログを「スレッド＋コメント」で記録する個人開発アプリ。
RareTECH ステップ449-457（マイアプリ作成ハンズオン）の提出物。

「調べたこと・詰まったこと」をスレッドとして立て、解決までの経過をコメントで
積み上げていく。スレッド単位で公開／限定公開／非公開を切り替えられる。

---

## 動作に必要なもの

| 必要なもの | 版 | 確認コマンド |
|---|---|---|
| Node.js | 22 以上 | `node -v` |
| npm | 10 以上 | `npm -v` |
| Docker | Compose v2 が使えるもの | `docker compose version` |

PostgreSQL をローカルに入れる必要はない（Docker で起動する）。

---

## セットアップ

初回だけ、上から順に実行する。**このブロックはまとめてコピペしてよい。**

```bash
git clone https://github.com/mr110825/cascade202609.git
cd cascade202609

cp .env.example .env
sed -i "s/changeme/$(grep POSTGRES_PASSWORD docker-compose.yml | cut -d: -f2 | tr -cd '[:alnum:]_-')/" .env

docker compose up -d
docker compose ps

npm ci
npx prisma migrate deploy
npm run dev
```

| コマンド | 何をするか | 通ったときに見えるもの |
|---|---|---|
| `cp .env.example .env` | 環境変数ファイルを作る | |
| `sed -i "s/changeme/…/" .env` | `.env` のパスワードを `docker-compose.yml` から引いて揃える | `grep -c changeme .env` が `0` |
| `docker compose up -d` | PostgreSQL 17 を起動する。healthy になるまで数秒かかる | `Container … Started` |
| `docker compose ps` | DB が上がったか確認する | `Up (healthy)` と `0.0.0.0:5434->5432/tcp` |
| `npm ci` | 依存を入れる。`postinstall` で `prisma generate` も走る | `added 706 packages` |
| `npx prisma migrate deploy` | `prisma/migrations/` を適用する | `All migrations have been successfully applied.` |
| `npm run dev` | 開発サーバーを起動する | `Ready in …` |

パスワードを手で写さないのは、`.env` と `docker-compose.yml` がずれると DB に繋がらないため。
1箇所から引けばずらしようがない。**`docker-compose.yml` のパスワードはローカル専用の捨て値**であり、
本番では使わない（本番の値は環境変数で渡す）。

`npm ci` の `postinstall`（`prisma generate`）は `DATABASE_URL` を読まないので、
`.env` が無くても通る。DB に繋ぐのは `prisma migrate deploy` から。

ブラウザで <http://localhost:3000> を開き、「新規登録」からアカウントを作れば使える。

### 停止と再開

| コマンド | 内容 |
|---|---|
| `docker compose stop` | DB を止める（データは残る） |
| `docker compose start` | 再開する |
| `docker compose down -v` | **データごと消す。** 次回は `migrate deploy` からやり直し |

### 詰まったら

| 症状 | 原因 | 対処 |
|---|---|---|
| `Bind for 0.0.0.0:5434 failed: port is already allocated` | 5434 を他のコンテナが使っている | 使っている側を止めるか、`docker-compose.yml` の `ports` と `.env` の URL を別番号に揃える。**失敗したコンテナが残るので `docker compose down` してから `up -d` し直す** |
| `P1000: Authentication failed against database server` | `.env` のパスワードが `docker-compose.yml` と違う | セットアップの `sed` の行を再実行し `grep -c changeme .env` が `0` になるのを確認 |
| `P1001: Can't reach database server` | DB が起動していない／ポートが公開されていない | `docker compose ps` で `Up (healthy)` と `0.0.0.0:5434->5432/tcp` を確認 |

---

## 開発中に使うコマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー（<http://localhost:3000>） |
| `npm run build` | 本番ビルド |
| `npm run typecheck` | `tsc --noEmit`。型だけを見る |
| `npm run lint` | ESLint |
| `npm run db:studio` | Prisma Studio。DB の中身をブラウザで見る |
| `npm run db:migrate` | スキーマを変えたときのマイグレーション作成（開発用） |

DB に直接 SQL を投げたいとき:

```bash
docker compose exec db psql -U cascade -d cascade
```

---

## 本番環境

```mermaid
flowchart LR
    U["ブラウザ"] -->|HTTPS| A
    G["GitHub main"] -->|"push で自動ビルド"| A
    subgraph AWS["AWS ap-northeast-1"]
        A["Amplify Hosting Gen1<br/>WEB_COMPUTE (SSR)<br/>※VPC の外"]
        S["Secrets Manager"]
        subgraph VPC["VPC 10.0.0.0/16"]
            subgraph PUB["Public Subnet x2 (AZ-a / AZ-c)"]
                DB[("Aurora Serverless v2<br/>PostgreSQL 17.9")]
            end
        end
    end
    A -->|"5432 / TLS 必須"| DB
    S -.->|"接続文字列を環境変数へ"| A
```

| 要素 | 採用 | 理由 |
|---|---|---|
| ホスティング | Amplify Hosting Gen1（`WEB_COMPUTE`） | Next.js の SSR をそのまま動かせる。`main` への push で自動ビルド |
| DB | Aurora Serverless v2 PostgreSQL 17.9 | ローカルの PostgreSQL 17 と版を揃えている |
| 最小容量 | `min_capacity = 0` | 1時間アクセスがないと 0 ACU まで落ちて課金が止まる。常時起動させる用途ではない |
| サブネット | Public Subnet のみ | 後述の理由で Aurora も公開サブネットに置いている |
| NAT Gateway | **使っていない** | Private Subnet を持たないため不要。この1台で月数千円が消える |
| シークレット | Secrets Manager | DB の接続文字列を置き、Amplify の環境変数へ渡す |

### なぜ Aurora が Public Subnet にあるのか

**Amplify Hosting の SSR 実行環境は VPC に配置できない**
（[amplify-hosting#3362](https://github.com/aws-amplify/amplify-hosting/issues/3362)、2023-03 に要望が立ち未提供）。
そのため「Next.js を VPC 内で動かし、Aurora を Private Subnet に隔離する」という
設計時（ステップ452）の構成は**前提から成立しない**。

3案を比べて最後の案を採った。

| 案 | 内容 | 判断 |
|---|---|---|
| ECS / App Runner へ載せ替え | VPC 内で SSR を動かす | ステップ455 の範囲を超える。Amplify を選んだ前提ごと崩れる |
| RDS Proxy を挟む | 接続を中継する | Proxy が常時課金。`min_capacity = 0` にした意味が消える |
| **Aurora を Public Subnet に置く** | ネットワーク層ではなく認証と暗号化で守る | **採用** |

公開サブネットに置いた分は、次の4点で埋めている。

| 守り | 実装 |
|---|---|
| TLS 必須 | クラスタパラメータグループで `rds.force_ssl = 1`。平文接続は DB 側が拒否する |
| 証明書の検証 | アプリが RDS の CA を同梱し、証明書とホスト名の両方を検証する（`verify-full` 相当。`src/lib/rds-ca.ts`） |
| パスワード | `random_password` が生成する32文字。人が入力することはなく Secrets Manager にだけ置く |
| 公開期間 | Amplify の SSR は送信元 IP が公開されておらず絞り込めないため 5432 は `0.0.0.0/0` に開く。`allow_amplify_db_access = false` で閉じられるようにし、動かす期間だけ `true` にする |

> **注意**: `src/lib/prisma.ts` は接続文字列に `sslmode` を**付けない**。
> node-postgres は `sslmode` が指定されているとコード側の `ssl` 設定を丸ごと無視するため、
> 付けると CA を渡せず証明書の検証に失敗する。TLS の設定は URL ではなくアプリ側に置いている。

---

## デプロイ

### 初回（インフラごと作る）

`infra/terraform.tfvars.example` を `infra/terraform.tfvars` にコピーし、`my_ip_cidr`（自宅のグローバル IP の `/32`）と
`github_repository` を書いてから、

```bash
cd infra
export TF_VAR_github_access_token="$(gh auth token)"

terraform init
terraform plan
terraform apply
```

続けて、本番 DB にマイグレーションを流す。

```bash
cd ..
export DATABASE_URL="$(aws secretsmanager get-secret-value \
  --secret-id "$(cd infra && terraform output -raw db_secret_name)" \
  --query SecretString --output text | jq -r .DATABASE_URL)"
npx prisma migrate deploy
```

URL は `cd infra && terraform output -raw amplify_url` で取れる。

### 2回目以降（アプリだけ）

**`main` に push すれば Amplify が自動でビルドして反映する。**
手で叩くコマンドは無い。

```bash
gh pr merge <PR番号> --squash --delete-branch   # ここで自動ビルドが走る

aws amplify list-jobs --region ap-northeast-1 \
  --app-id "$(cd infra && terraform output -raw amplify_app_id)" \
  --branch-name main --max-results 3 \
  --query 'jobSummaries[].[jobId,status,commitId]' --output table
```

ビルドの中身は**リポジトリルートの `amplify.yml`** が正本（Terraform 側に `build_spec` は書いていない）。

> **`amplify.yml` の `.env.production` 書き出しは消さないこと。**
> Amplify Gen1 の環境変数は**ビルド時にしか渡らず SSR ランタイムには届かない**ため、
> ビルド中に `.env.production` へ書き出している。消すと本番で `DATABASE_URL` が
> `undefined` になり、全ページが 500 になる。

### state の扱い

**state はローカルにしか無い**（`infra/terraform.tfstate`）。
S3 バックエンドは使っていないので、`apply` のたびにリポジトリ外へ控えを取る。

```bash
cp infra/terraform.tfstate ~/cascade-tfstate-backup/terraform.tfstate.$(date +%Y%m%d%H%M%S)
chmod 600 ~/cascade-tfstate-backup/terraform.tfstate.*
```

**state には DB のパスワードが平文で入る。** リポジトリには絶対に置かない
（ルートの `.gitignore` で `*.tfstate` を除外している）。

---

## 撤収

学習用の構成なので、レビューが終わったら消す。**Aurora は止めているだけでは
ストレージ課金が続く**ため、使わないなら消すのが正しい。

```bash
cd infra
terraform destroy
```

消え残りが無いか確認する（どれも何も返らないのが期待値）。

```bash
aws rds describe-db-clusters --region ap-northeast-1 \
  --query "DBClusters[?starts_with(DBClusterIdentifier,'cascade')].DBClusterIdentifier" --output text
aws amplify list-apps --region ap-northeast-1 \
  --query "apps[?name=='cascade202609'].appId" --output text
aws ec2 describe-vpcs --region ap-northeast-1 \
  --filters 'Name=tag:Project,Values=cascade202609' --query 'Vpcs[].VpcId' --output text
```

`terraform destroy` が途中で止まったらもう一度打つ。Aurora の削除は数分かかり、
依存関係の解決待ちでタイムアウトすることがある。
`deletion_protection = false` / `skip_final_snapshot = true` にしてあるので、
state を失った場合でも `aws rds delete-db-cluster` 等で手で消せる。

---

## 技術スタック

| レイヤー | 採用 | 選定理由 |
|---|---|---|
| フレームワーク | Next.js 16（App Router） | Server Component と Server Action で、フォーム送信に API を書かずに済む |
| 言語 | TypeScript 5 | |
| UI | React 19 | 状態は URL（`?edit=` `?q=` `?status=`）で持ち、クライアント側の state をほぼ使わない |
| CSS | Tailwind CSS v4 | `tailwind.config.js` は無い。デザイントークンは `globals.css` の `@theme` |
| DB | PostgreSQL 17（Docker） | ステップ455 で載せ替える Aurora の LTS が 17 系のため版を合わせている |
| ORM | Prisma 7 | Rust エンジン廃止版。接続は driver adapter（`@prisma/adapter-pg`）経由 |
| 認証 | 自前のセッション実装 | 認証ライブラリなし。argon2 + DB セッション + httpOnly Cookie |
| Markdown | react-markdown + remark-gfm + Shiki | コメント本文。コードブロックは github-dark で色が付く |
| 検索 | PostgreSQL の `ILIKE` | Prisma の `contains` + `mode: "insensitive"` |

---

## データモデル（4テーブル）

```mermaid
erDiagram
    User ||--o{ Session : "ログインするたびに発行"
    User ||--o{ Thread  : "書く"
    User ||--o{ Comment : "書く"
    Thread ||--o{ Comment : "本文とやりとり"

    User {
        string   id PK
        string   email UK
        string   name UK
        string   passwordHash
        datetime createdAt
        datetime updatedAt
    }
    Session {
        string   id PK "トークンの SHA-256"
        string   userId FK
        datetime expiresAt
        datetime createdAt
    }
    Thread {
        string   id PK
        string   title
        enum     status "OPEN / CLOSED"
        enum     visibility "PUBLIC / LIMITED / PRIVATE"
        string   authorId FK
        datetime createdAt
        datetime updatedAt
    }
    Comment {
        string   id PK
        string   body
        string   threadId FK
        string   authorId FK
        datetime createdAt
        datetime updatedAt
    }
```

正本は `prisma/schema.prisma`。設計上のポイントは3つ。

- **`Thread` は本文を持たない。** 本文にあたるものは最初の `Comment`。
  「質問 → 経過 → 解決」が同じ形で一列に並ぶ。
- **`Session.id` にはブラウザへ渡した値そのものを入れない。** 入れるのはその
  SHA-256。DB が漏れても、そのままログインに使える値は入っていない。
- **`Visibility` は3値。** `PUBLIC` は誰でも、`LIMITED` は一覧に出ないが URL を
  知っていれば誰でも、`PRIVATE` は本人だけ。
- 外部キーはすべて `onDelete: Cascade`。ユーザーを消せばスレッドもコメントも消える。

タグのテーブルは無い（Phase 2 送り）。

---

## 画面

| パス | 内容 | ログイン |
|---|---|---|
| `/` | 公開スレッド一覧・検索・ステータス絞り込み | 不要 |
| `/signup` `/login` | 登録・ログイン | 不要 |
| `/dashboard` | 自分のスレッド一覧・検索・絞り込み | 必要 |
| `/threads/new` | スレッド作成 | 必要 |
| `/threads/[id]` | スレッド詳細（本文・コメント・公開設定の切替） | 公開設定による |
| `/settings` | ユーザー名変更・パスワード変更 | 必要 |
| `/terms` `/privacy` | 利用規約・プライバシーポリシー | 不要 |

スレッド詳細の「いま何を編集しているか」は URL の `?edit=` で表している
（`?edit=title` / `?edit=<コメントID>`）。クライアント側に状態を持たないので、
この画面は全部 Server Component で書けている。

---

## REST API

MVP の提供チャネルに REST API が入っているため、スレッドとコメントは API からも
操作できる。認証は画面と同じセッション Cookie を使う。

| メソッド | パス | 内容 |
|---|---|---|
| GET / POST | `/api/threads` | 公開スレッド一覧（`?q=` `?status=`）／作成 |
| GET / PATCH / DELETE | `/api/threads/:id` | 取得／タイトル・ステータス・公開設定の変更／削除 |
| GET / POST | `/api/threads/:id/comments` | コメント一覧／追加 |

画面と API は同じ `src/lib/services/*.ts` を呼ぶ。だから「画面では見えないのに
API では見える」といったずれが起きない。

---

## 認証と権限で守っていること

- パスワードのハッシュは自作せず `@node-rs/argon2` に任せる
- セッションIDは `crypto.randomBytes(32)`。**DB にはその SHA-256 を保存**する
- Cookie は `httpOnly` + `sameSite=lax` +（本番のみ）`secure`
- ログイン失敗のメッセージは「メールアドレスが無い」と「パスワードが違う」で変えない
- 見えてはいけないものは **403 ではなく 404** を返す（存在そのものを漏らさない）
- 更新・削除は `updateMany` / `deleteMany` の `where` に `authorId` を入れる。
  他人の ID を指定しても更新件数が 0 になるだけ
- `src/proxy.ts` は Cookie の有無しか見ない。**本当の確認は各ページの `requireUser()`**

---

## ディレクトリ構成

```
src/
  app/
    page.tsx            トップ（公開スレッド一覧）
    dashboard/          自分のスレッド一覧
    threads/            作成・詳細
    login/ signup/ settings/
    terms/ privacy/     法務ページ（DB を見ない）
    actions/            Server Action。フォームの受け口
    api/                REST API
    layout.tsx          全ページ共通の外枠
    globals.css         デザイントークンと共通クラス
  components/           表示部品（Header / Footer / ThreadCard / Markdown ほか）
  lib/
    services/           業務ロジック本体。画面と API の共通の土台
    auth.ts             「いまログインしているのは誰か」
    session.ts          セッションの発行・確認・破棄
    password.ts         ハッシュ化と照合
    prisma.ts           DB 接続（Prisma 7 の driver adapter）
  proxy.ts              未ログインを /login へ送る入口（Next.js 16 での middleware）
prisma/
  schema.prisma         テーブル定義
  migrations/           マイグレーション
```

呼び出しの向きは常に `page.tsx` / `route.ts` → `actions/` → `lib/services/` →
`lib/prisma.ts` の一方向。`services/` から画面を呼ぶことはない。

---

## 実装していないもの（意図的）

MVP 20件を実装している。以下は Phase 2 以降。

- タグ（付与・編集・絞り込み）… テーブルごと無し
- ページネーション・ソート切り替え・削除確認ダイアログ
- 本文（コメント）の全文検索。検索対象はスレッドのタイトルだけ
- 限定公開URLを共有するための導線（値と判定はあるが専用UIは無し）
- メール確認 / パスワードリセット / アカウント削除 / ログイン試行制限
- 画像アップロード

---

## 注意

`npm audit` に警告が出るが、**`npm audit fix --force` は実行しないこと。**
Prisma を 6 系へダウングレードしようとするため、`src/lib/prisma.ts` の
driver adapter 構成ごと壊れる（`--dry-run` で確認済み）。
警告はいずれも Next.js / Prisma が内部で使っているパッケージのもの。

npm 11 はインストールスクリプトを既定でブロックする。承認済みのパッケージは
`package.json` の `allowScripts` に記録してある。

---

## ライセンス

学習目的の個人開発。ライセンスは設定していない。

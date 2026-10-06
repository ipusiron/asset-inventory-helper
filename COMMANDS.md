# コマンドリファレンス - 資産情報取得の詳細ガイド

このドキュメントでは、各OS環境でソフトウェア資産情報を取得するための詳細なコマンドを記載しています。

直接貼り付けられるのは、名前とバージョンの2列、見出しつきwinget、dpkg、Homebrewです。
ハードウェア、クラウド、ネットワークなどの取得例は資産管理一般の参考であり、その出力の解析には対応していません。
このページがコマンドを実行することはありません。
公式資料と構文は確認していますが、すべてのOSで実際の収集結果を検証したものではありません。

---

## 📋 目次

1. [Windows](#windows)
2. [Linux](#linux)
3. [macOS](#macos)
4. [ポータブル版ソフトウェアの管理](#ポータブル版ソフトウェアの管理)
5. [ハードウェア資産の洗い出し](#ハードウェア資産の洗い出し)
6. [その他の資産管理](#その他の資産管理)

---

## Windows

### 基本コマンド

```cmd
winget list
```

### PowerShellを使用した高度な取得方法

#### レジストリから取得（推奨）

Uninstallキーから登録された名前と版を取得できます。
この方法だけでポータブルアプリなどを網羅できるわけではありません。

**一覧表示（名前・バージョン）:**
```powershell
$paths = @(
  'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
  'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
  'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*'
)

Get-ItemProperty -Path $paths -ErrorAction SilentlyContinue |
  Where-Object { $_.DisplayName } |
  Select-Object @{n='Name';e={$_.DisplayName}}, @{n='Version';e={$_.DisplayVersion}} |
  Sort-Object Name
```

**CSVにエクスポート:**
```powershell
$paths = @(
  'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
  'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
  'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*'
)

Get-ItemProperty -Path $paths -ErrorAction SilentlyContinue |
  Where-Object { $_.DisplayName } |
  Select-Object @{n='Name';e={$_.DisplayName}}, @{n='Version';e={$_.DisplayVersion}} |
  Sort-Object Name |
  Export-Csv -Path .\installed_apps.csv -NoTypeInformation -Encoding UTF8
```

**追加情報の取得（Publisher、InstallLocation等）:**
```powershell
Get-ItemProperty -Path $paths -ErrorAction SilentlyContinue |
  Where-Object { $_.DisplayName } |
  Select-Object `
    @{n='Name';e={$_.DisplayName}},
    @{n='Version';e={$_.DisplayVersion}},
    @{n='Publisher';e={$_.Publisher}},
    @{n='InstallLocation';e={$_.InstallLocation}},
    @{n='InstallDate';e={$_.InstallDate}} |
  Sort-Object Name
```

#### 貼り付け用の2列を生成

```powershell
# 上の例の$pathsを使い、名前と版をTAB1個で区切る
Get-ItemProperty -Path $paths -ErrorAction SilentlyContinue |
  Where-Object { $_.DisplayName } |
  ForEach-Object { "{0}`t{1}" -f $_.DisplayName, $_.DisplayVersion }
```

### 注意事項

- 権限が必要な箇所だけ環境の管理方針に従って実行する。一覧取得のための一律の管理者起動は不要
- HKLMの32bit/64bit登録と実行ユーザーのHKCUを参照する。他ユーザーを網羅するものではなく、重複もあり得る
- Win32_Product は MSI の再構成をトリガーするため使用しない
- 貼り付け用2列または見出しつきwinget表を入力し、保留と除外の行も確認する

CSVファイルの直接入力には対応していません。
`winget list`は英語または日本語の見出しつき表を貼り付けます。
更新候補ではなくVersion列を採用します。
[Microsoftのlistコマンドの説明](https://learn.microsoft.com/en-ca/windows/package-manager/winget/list)を参照してください。
Win32_Productの列挙ではMSIの整合性確認と修復が起きるため、一覧取得の案内には使いません。
[Microsoftの説明](https://devblogs.microsoft.com/scripting/use-powershell-to-find-installed-software/)を参照してください。

---

## Linux

### Debian/Ubuntu系

```bash
# 基本
dpkg -l

# 名前と版のみ（未インストールの状態も含まれ得るため状態確認が必要）
dpkg-query -W -f='${Package}\t${Version}\n'

# インストール済みパッケージのみ（推奨）
dpkg -l | grep "^ii"
```

### RedHat/CentOS/Fedora系

```bash
# 一覧確認用（この出力の直接解析には未対応）
rpm -qa

# 名前とバージョンを整形
rpm -qa --qf '%{NAME}\t%{VERSION}-%{RELEASE}\n'

# ソート済み
rpm -qa | sort
```

### 汎用パッケージ管理

以下は参考の取得例です。
直接解析せず、必要な名前と版をTAB区切りの2列へ整理してください。

```bash
# Flatpak
flatpak list --columns=application,version

# Snap
snap list

# AppImage（手動管理が必要）
find ~/Applications -name "*.AppImage" 2>/dev/null
```

### Python パッケージ

```bash
# pip
pip list
pip freeze

# conda
conda list
```

### Node.js パッケージ

```bash
# グローバルパッケージ
npm list -g --depth=0

# ローカルパッケージ
npm list --depth=0
```

---

## macOS

### Homebrew

「Homebrew」を選ぶか、先頭に`brew list --versions`のコマンド行を含めます。
複数版は別レコードとして保持します。
`--verbose`はパス一覧であり、本ツールの解析対象ではありません。

```bash
# 基本（バージョン付き）
brew list --versions

# 詳細情報
brew list --verbose

# Caskアプリケーション
brew list --cask --versions
```

### システムアプリケーション

以下の出力は本ツールの解析対象外です。

```bash
# すべてのアプリケーション
system_profiler SPApplicationsDataType

# 名前とバージョンのみ（高速）
system_profiler SPApplicationsDataType | grep -E "^    [^ ]|Version:"

# App Storeからインストールしたアプリ
find /Applications -maxdepth 1 -name "*.app" -exec mdls -name kMDItemAppStoreHasReceipt {} \; 2>/dev/null
```

### MacPorts

```bash
# インストール済みパッケージ
port installed
```

---

## ポータブル版ソフトウェアの管理

一部のソフトウェアは、インストーラーを使用せずにZIPなどから展開した **ポータブル版 exe** として利用される場合があります。これらはレジストリやパッケージ管理システムに登録されないため、通常の資産洗い出しでは検出できません。

### Windows - ディレクトリー走査

```powershell
# 実行ファイルのリスト化
Get-ChildItem -Path "C:\Tools", "C:\PortableApps" -Filter *.exe -Recurse -ErrorAction SilentlyContinue |
    Select-Object FullName, LastWriteTime, Length, 
        @{n='Version';e={(Get-Item $_.FullName).VersionInfo.FileVersion}}

# ハッシュ値を含む詳細情報
Get-ChildItem -Path "C:\Tools" -Filter *.exe -Recurse |
    ForEach-Object {
        $hash = Get-FileHash $_.FullName -Algorithm SHA256
        [PSCustomObject]@{
            Name = $_.Name
            Path = $_.FullName
            Size = $_.Length
            Modified = $_.LastWriteTime
            SHA256 = $hash.Hash
            Version = (Get-Item $_.FullName).VersionInfo.FileVersion
        }
    } | Export-Csv portable_apps.csv -NoTypeInformation
```

### Linux/macOS - ポータブルアプリの検索

```bash
# バイナリファイルの検索
find ~/bin ~/opt /opt -type f -executable 2>/dev/null | head -20

# AppImageファイル
find ~ -name "*.AppImage" 2>/dev/null

# 自己解凍型アーカイブ
find ~/Applications -name "*.run" -o -name "*.sh" 2>/dev/null
```

---

## ハードウェア資産の洗い出し

ハードウェア資産の把握は、OSライセンス管理やパッチ適用範囲の確認にも役立ちます。

### Windows

**基本情報:**
```cmd
systeminfo
```

**詳細情報（PowerShell）:**
```powershell
# コンピューター情報
Get-ComputerInfo | Select-Object CsName, OsName, OsVersion, CsManufacturer, CsModel

# CPU情報
Get-WmiObject Win32_Processor | Select-Object Name, NumberOfCores, MaxClockSpeed

# メモリ情報
Get-WmiObject Win32_PhysicalMemory | Select-Object Manufacturer, PartNumber, Capacity, Speed

# ディスク情報
Get-PhysicalDisk | Select-Object FriendlyName, MediaType, Size, HealthStatus
```

### Linux

**システム情報:**
```bash
# 基本情報
uname -a
lsb_release -a

# CPU情報
lscpu

# メモリ情報
free -h

# ディスク情報
lsblk
df -h

# ハードウェア詳細
sudo lshw -short
```

**ネットワーク情報:**
```bash
ip addr
ip link show
```

### macOS

**システム概要:**
```bash
# ハードウェア概要
system_profiler SPHardwareDataType

# ストレージ情報
system_profiler SPStorageDataType

# ネットワーク情報
system_profiler SPNetworkDataType
```

---

## その他の資産管理

### ネットワーク資産

**Windows:**
```powershell
# ネットワークアダプター
Get-NetAdapter | Select-Object Name, Status, MacAddress, LinkSpeed

# 接続済みデバイス（ARP）
arp -a
```

**Linux/macOS:**
```bash
# ネットワークインターフェース
ip link show  # Linux
ifconfig      # macOS

# ARPテーブル
arp -a

# 開いているポート
ss -tuln     # Linux
netstat -an  # macOS
```

### クラウド資産

**AWS:**
```bash
# EC2インスタンス
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,InstanceType,State.Name]' --output table

# S3バケット
aws s3 ls
```

**Azure:**
```bash
# 仮想マシン
az vm list --output table

# ストレージアカウント
az storage account list --output table
```

**Docker:**
```bash
# コンテナー
docker ps -a

# イメージ
docker images

# ボリューム
docker volume ls
```

### 証明書とライセンス

**SSL/TLS証明書:**
```bash
# 証明書の確認
openssl x509 -in certificate.crt -text -noout

# 有効期限の確認
openssl x509 -in certificate.crt -dates -noout
```

**Windowsライセンス:**
```cmd
slmgr /dli
```

---

## 資産情報の統合

取得した各種資産情報を統合する際の推奨フォーマット：

```csv
Type,Name,Version,Location,LastUpdated,Notes
Software,Git,2.46.0,System,2024-09-07,Package Manager
Software,VSCode,1.82.0,C:\Tools,2024-09-07,Portable
Hardware,Dell-PC,OptiPlex-7090,Office-A,2024-09-07,Main-Workstation
Network,Router,RT-AX88U,ServerRoom,2024-09-07,Firmware-3.0.0.4
Cloud,EC2,t3.medium,us-east-1,2024-09-07,WebServer
```

---

## ベストプラクティス

1. **定期実行**: 月次または四半期ごとに資産情報を更新
2. **自動化**: スクリプト化して定期実行
3. **バージョン管理**: 資産リストの変更履歴を保持
4. **差分確認**: 前回との差分を確認して変更を把握
5. **承認リスト**: 許可されたソフトウェアのリストと照合

---

関連資料：[dpkg-query](https://manpages.debian.org/jessie/dpkg/dpkg-query.1.en.html)、[RPMの出力形式](https://rpm.org/docs/4.20.x/manual/queryformat.html)、[Homebrew](https://docs.brew.sh/Manpage)。

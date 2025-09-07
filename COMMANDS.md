# コマンドリファレンス - 資産情報取得の詳細ガイド

このドキュメントでは、各OS環境でソフトウェア資産情報を取得するための詳細なコマンドを記載しています。

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

`winget list` は環境によって JSON が混ざる／拾えないアプリがある等の課題があるため、**レジストリの Uninstall キー** から取得する方法を推奨します。

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

#### wingetのJSON出力を整形

```powershell
# Name, Version のみ抽出
winget list --output json | ConvertFrom-Json | % Installed | Select-Object Name, Version

# 貼り付け向け（スペース区切り）
winget list --output json | ConvertFrom-Json | % Installed | % { "{0} {1}" -f $_.Name, $_.Version }
```

### 注意事項

- 管理者権限の PowerShell を推奨（HKLM 配下へ確実にアクセスするため）
- 32bit/64bit の双方（WOW6432Node を含む）と HKCU を参照して重複を最小化
- Win32_Product は MSI の再構成をトリガーするため使用しない
- 出力は本ツールに貼り付けて整形・可視化できます

---

## Linux

### Debian/Ubuntu系

```bash
# 基本
dpkg -l

# 名前とバージョンのみ
dpkg-query -W -f='${Package} ${Version}\n'

# インストール済みパッケージのみ（推奨）
dpkg -l | grep "^ii"
```

### RedHat/CentOS/Fedora系

```bash
# 基本
rpm -qa

# 名前とバージョンを整形
rpm -qa --qf "%{NAME} %{VERSION}-%{RELEASE}\n"

# ソート済み
rpm -qa | sort
```

### 汎用パッケージ管理

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

```bash
# 基本（バージョン付き）
brew list --versions

# 詳細情報
brew list --verbose

# Caskアプリケーション
brew list --cask --versions
```

### システムアプリケーション

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

*最終更新: 2024年9月7日*
[![CodeQL](https://github.com/leandro-lorenzini/open-vault/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main)](https://github.com/leandro-lorenzini/open-vault/actions/workflows/github-code-scanning/codeql)
[![Build](https://github.com/leandro-lorenzini/open-vault/actions/workflows/build.yml/badge.svg)](https://github.com/leandro-lorenzini/open-vault/actions/workflows/build.yml)
# OvenVault
Open-vault is password manager designed for small and medium organizations with support to SAML authentication, it allows teams to share passwords for those applications that do not support identity management, it relies on public/private keys for securely storing and sharing passwords.

### Features
:white_check_mark: Safely stores password and TOTPs in a central database

:white_check_mark: Sharing passwords and TOTPs with colleagues

:white_check_mark: Grouo based access rights

:white_check_mark: Password and TOTP encryption/decryption executed by the client (Plain text password/TOTP never transmitted to the server)

:white_check_mark: Local Database authentication or Single Sign-on using SAML

:white_check_mark: Security dashboard with checks for weak and old passwords

:white_check_mark: Organization master key for password/TOTP recovery

### How does it work?
The user authenticates to the server using the Desktop client, if that's the first user login on that device, a private and public key are generated by the client. The private key is encrypted and saved in the local computer and a copy of the public key is sent to the server.

When the user created a new password, the client will encrypt that password using every other user's public keys and then send the encrypted password to the server.

When a user wants to read a password, the user will retreive the encrypted password from the server and the client will decrpt that password with the locally stored private key.

A syncronization happens every 15 seconds in the client to make sure evey one has the newest version of evey password, if a password doesn't have an encrypted version for it using any user's public key, then the client will get a copy of that user's public key, encrypt the password using that key and submit the encrypted password to the server.

## Deploying the server
There are two out of the box deployment methods, kubernetes and docker-container, 
they botth include the configuration for a mongo instance, remove that configuration if you want to use an existing mongodb instance.

#### Environment variables reference
|Variable               |Required   |Default value                          |Description                                                    |
|-----------------------|-----------|---------------------------------------|---------------------------------------------------------------|
|DATABASE_URL           |No         |mongodb://mongo:27017/open-vault       |                                                               |
|URL                    |Yes        |                                       |The url to access the server, MUST start with ```https://``    |
|SESSION_SECRET         |Yes        |                                       |A random strong secret for session storage                     |
|WINDOWS_INSTALLER      |No         |Github Link to the client installer    |Only set this variable if you have built the client by yourself|
|MAC_INSTALLER          |No         |Github Link to the client installer    |Only set this variable if you have built the client by yourself|
|LINUX_DEB_INSTALLER    |No         |Github Link to the client installer    |Only set this variable if you have built the client by yourself|
|LINUX_RPM_INSTALLER    |No         |Github Link to the client installer    |Only set this variable if you have built the client by yourself|

### Kubernetes
```bash
git clone https://github.com/leandro-lorenzini/open-vault.git && cd open-vault/kubernetes
# Update the environment variables under deployment.yaml
# Note that with the current implementation you must use a proxy with SSL enabled when using Kubernetes.
kubectl apply -f .
```

### Docker-compose
```bash
git clone https://github.com/leandro-lorenzini/open-vault.git && cd open-vault/server
# Update the environment variables under docker-compose.yml
# If you have built the clients by yourself, don't forget to place them under ```assets/installers``` and yo update the installer variables.
# Place your SSL key.pem and cert.pem under ```./server``` if you wish to run the project with SSL instead of using a proxy.
docker-compose up -d
```

### Configure the server
The server configuration is done via the Desktop client.

Download and install the desktop client (Under the release page) that matched the installed server version. You can also build the client by yourself following the instreuction on the next section of this page. Once the client starts, you'll enter the server address and the client will then detect that this is a new server deployment and will ask you to setup the organization. Simply provide the information the if asked during the wizard and that's it.

## Building the client by yourself
The advantage of building it yourself is that you can set the default server address, so if you are deploying to multiple users, they won't have to manually set the server address.

Another adventage is that you can sign the software during the build using your organization key for an easier deployment later.

1. Clone the repository to your local machine.
2. Building the client (Installer)
```bash
cd gui
export REACT_APP_SERVER_URL="https://<YOUR-SERVER-URL>/"
npm install
npm run build && npm run make
```
The building process only generates the installer for the current OS, so you might need to run these commands in different devices to get other version of the installar as well. Eg. Run the commands on MacOs to generate the pkg and the dmg files, run it on Windows to generate the exe and chocolatey files.

If you want to sign the software during the build you can refer to the ```electron forge documentation``` for details.

## Development notes
### Technology & stack
- NodeJs
- React
- Electron
- Ant Design
- MongoDB

### Useful commands
Generate self-signed certificate to use in development mode
```bash
cd server
openssl genrsa -out key.pem
openssl req -new -key key.pem -out csr.pem
openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem
```

Starting the client in development mode
```bash
cd gui
npm react
npm start
```

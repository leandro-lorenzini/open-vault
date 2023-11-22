[![CodeQL](https://github.com/leandro-lorenzini/open-vault/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main)](https://github.com/leandro-lorenzini/open-vault/actions/workflows/github-code-scanning/codeql)
[![Build](https://github.com/leandro-lorenzini/open-vault/actions/workflows/build.yml/badge.svg)](https://github.com/leandro-lorenzini/open-vault/actions/workflows/build.yml)
# open-vault
Open-vault is password manager designed for small and medium organizations with support to SAML authentication, it allows teams to share passwords for those applications that do not support identity management, it relies on public/private keys for securely storing and sharing passwords.

## Features
:white_check_mark: Safely stores password and TOTPs in a central database

:white_check_mark: Sharing passwords and TOTPs with colleagues

:white_check_mark: Password and TOTP encryption/decryption executed by the client (Plain text password/TOTP never transmitted to the server)

:white_check_mark: Local Database authentication or Single Sign-on using SAML standard

:white_check_mark: Security dashboard with checks for weak and old passwords

:white_check_mark: Organization master key for password/TOTP recovery

## Deploying the server
There are two out of the box deployment methods, kubernetes and docker-container, 
they botth include the configuration for a mongo instance, remove that configuration if you want to use an existing mongodb instance.

### Kubernetes
```
git clone https://github.com/leandro-lorenzini/open-vault.git && cd open-vault/kubernetes
# Update the environment variables under deployment.yaml
# Note that with the current implementation you must use a proxy with SSL enabled when using Kubernetes.
kubectl apply -f .
```

### Docker-compose
```
git clone https://github.com/leandro-lorenzini/open-vault.git && cd open-vault/server
# Update the environment variables under docker-compose.yml
# If you have built the clients by yourself, don't forget to place them under ```assets/installers``` and yo update the installer variables.
# Place your SSL key.pem and cert.pem under ```./server``` if you wish to run the project with SSL instead of using a proxy.
docker-compose up -d
```

### Configure the server
Install the client that has been generated on the first step on your local machine. Once the client starts it will then detect that this is a new server deployment and will ask you to setup the organization. Simply provide the information the if asked during the wizard and that's it.

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


### Building the client by yourself
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

## How it works
Passwords are all stored in the database after being encrypted using each user’s public key.

he encryption and decryption of passwords are always performed by the client, meaning that the server will never receive any plain text password.

The private key is generated by the client and only stored in the client’s device and is never sent to the server. 
The private key is also protected by a local password that is defined by the user after the first login.

When a user creates or updates a password, the password will be encrypted using every user’s public keys and the ciphertext will be sent to the server and stored in the database, a syncronization happens every 15 seconds in the client level to make sure evey one has the newest version of evey password.

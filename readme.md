[![CodeQL](https://github.com/leandro-lorenzini/open-vault/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main)](https://github.com/leandro-lorenzini/open-vault/actions/workflows/github-code-scanning/codeql)
[![Build](https://github.com/leandro-lorenzini/open-vault/actions/workflows/build.yaml/badge.svg)](https://github.com/leandro-lorenzini/open-vault/actions/workflows/build.yaml)
# About this project
Open-vault is password manager designed for small and medium organizations with support to SAML authentication, it allows teams to share passwords for those applications that do not support identity management.
This is a new project, and I only work on it during my free time, so I'm more than happy to have collaborators. Feel free to challenge the concept, the code logic and to create pull requests with improvements.

## Installation process
### Preparing the client
#### Option 1 - Download build from repository
You can download the build for macOs, Windows and Linux under the [releases page](../../releases) of this repository.
#### Optiom 2 - Build the client
The advantage of building it yourself is that you can set the default server address, so if you are deploying to multiple users, they won't have to manually set the server address.
1. Clone the repository to your local machine.
2. Building the client (Installer)
```bash
cd gui
export REACT_APP_SERVER_URL="https://<YOUR-SERVER-URL>/"
npm install
npm run build && npm run make
```
The building process only generates the installer for the current OS, so you might need to run these commands in different devices to get other version of the installar as well. Eg. Run the commands on MacOs to generate the pkg and the dmg files, run it on Windows to generate the exe and chocolatey files.

### Deploying the server
1. Clone the repository to the server where you want to deploy the application.
2. Copy the [client installer files](../../releases) to the sever's `assets` folder, those files can be found under the release page of this repository. If you built the client by yourself, then youse the instead.
3. Set the environment variables
```bash
export DATABASE_URL="mongodb://<USER>:<PASSWD>@<MONGO-URL>:27017/open-vault?authSource=admin"
export URL="https://<SERVER FQDN>/"
export PORT=443
export SESSION_SECRET="<RAMDOM STRINGT>"
export INSTALLER_VERSION="0.0.9"
export WINDOWS_INSTALLER=<0|1>
export MAC_INSTALLER=<0|1>
export LINUX_INSTALLER=<0|1>
```
5. Place the server SSL certificate as follows:
    - ./server/cert.pem
    - ./server/key.pem
Note that a valid certificate has to be provided, otherwise the client won't be able to communicate with the server when running the client in Production mode.
6. Start the server.
```bash
cd server
docker-compose up -d
```
6. Configure the server.
Install the client that has been generated on the first step on your local machine. Once the client starts it will then detect that this is a new server deployment and will ask you to setup the organization. Simply provide the information the if asked during the wizard and that's it.

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
When a user connects to the client in a device for the first time, a private and public key are generated. The private key is encrypted with an additional password (called as local key) and then saved to the local disk, the public key is sent to the server. A user will have multiple key pairs if the user connects to the server using more than one device. The local key can be different from device to device for a single user as that password is not stored in the server and it's simply used to decrypt the user's private key in a specific device.

When a user creates a new password, that password will be encrypted on the client side using the user's public key, the ciphertext is then stored in the server.

If a password is being shared with other users, then the user who created the secret will be requested to encrypt that secret using those other users' public keys.

As users can be granted access to existing passwords and passwords can be updated at any time, all active clients call the server every 15 seconds to check if there are missing or outdated ciphertexts, in this case, not only the user who created the password, but any user with access to that password can perform the encryption during the syncronization.

Everytime that a passwords is created or updated, a ciphertext is generated using the organizarion's public key, this means that even if no user has a access to the password, the password can still be recovered. The organization's private and public keys are generated during the server initial configuration, the keys are generated by the client, so the server will never have access to the private key.


### Project status and disclaimer
It's been a few years that I don't do full-stack development, so code reviews and tests are highly appreciated.

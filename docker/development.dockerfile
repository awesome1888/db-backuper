FROM node:8.11.3
RUN apt-get update && apt-get install -y --no-install-recommends vim apt-transport-https && apt-get clean
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5 && echo "deb http://repo.mongodb.org/apt/debian jessie/mongodb-org/3.6 main" | tee /etc/apt/sources.list.d/mongodb-org-3.6.list && apt-get update && apt-get install -y mongodb-org-tools;
WORKDIR /usr/src/app
# RUN groupadd -r owner && useradd -m -r -g owner owner && chown -R owner:owner /usr/src/app
# USER owner
# RUN chown -R owner:owner /usr/src/app && echo "\nalias ll=\"ls -al\"" >> /home/owner/.bashrc
# RUN mkdir "/usr/src/app/volume/" && chown -R owner:owner "/usr/src/app/volume/"
# COPY --chown=owner:owner package*.json ./
COPY package*.json ./
RUN npm install
# COPY --chown=owner:owner ./src/ .
COPY ./src/ .
CMD [ "npm", "start" ]

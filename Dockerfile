FROM node:lts-buster

RUN git clone https://github.com/JJK/OVL-MD-SESSION-ID /root/SLG-MD-SESSION-ID

WORKDIR /root/SLG-MD-SESSION-ID

COPY package.json .
RUN npm i
COPY . .

EXPOSE 8000

CMD ["npm","run","Pqs"]
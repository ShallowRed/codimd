# Variante du deployments/Dockerfile upstream, adaptée au build self-hosted.
#
# Différence : on retire `git reset --hard && git clean -fx` (utiles seulement au
# CI upstream sur un checkout propre ; ici ils échouent sur "dubious ownership"
# quand le contexte est copié sur le VPS, et effaceraient infra/ non commité).
# Le reste est identique à deployments/Dockerfile.

ARG RUNTIME
ARG BUILDPACK

FROM $BUILDPACK as BUILD

COPY --chown=hackmd:hackmd . .
ENV QT_QPA_PLATFORM=offscreen

RUN set -xe && \
    npm install && \
    npm run build && \
    cp ./deployments/docker-entrypoint.sh ./ && \
    cp .sequelizerc.example .sequelizerc && \
    rm -rf .git .gitignore .travis.yml .dockerignore .editorconfig .babelrc .mailmap .sequelizerc.example \
        test docs contribute \
        package-lock.json webpack.prod.js webpack.htmlexport.js webpack.dev.js webpack.common.js \
        config.json.example README.md CONTRIBUTING.md AUTHORS node_modules

FROM $RUNTIME
USER hackmd
ENV QT_QPA_PLATFORM=offscreen
WORKDIR /home/hackmd/app
COPY --chown=1500:1500 --from=BUILD /home/hackmd/app .
RUN npm install --production && npm cache clean --force && rm -rf /tmp/{core-js-banners,phantomjs}
EXPOSE 3000
ENTRYPOINT ["/home/hackmd/app/docker-entrypoint.sh"]

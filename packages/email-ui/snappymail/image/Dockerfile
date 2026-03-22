FROM djmaze/snappymail:v2.38.2

COPY tlao-snappymail-entrypoint.sh /usr/local/bin/tlao-snappymail-entrypoint.sh
COPY tlao-apply-branding.sh /usr/local/bin/tlao-apply-branding.sh
COPY app/templates/Index.html /snappymail/snappymail/v/2.38.2/app/templates/Index.html
COPY static/js/tlao-login-footer.js /snappymail/snappymail/v/2.38.2/static/js/tlao-login-footer.js
COPY themes/TlaoMail/styles.css /snappymail/snappymail/v/2.38.2/themes/Default/styles.css
COPY themes/TlaoMail/images/tlao-mark.svg /snappymail/snappymail/v/2.38.2/themes/Default/images/tlao-mark.svg

RUN chmod 0755 /usr/local/bin/tlao-snappymail-entrypoint.sh /usr/local/bin/tlao-apply-branding.sh \
  && chmod 0644 /snappymail/snappymail/v/2.38.2/app/templates/Index.html /snappymail/snappymail/v/2.38.2/static/js/tlao-login-footer.js /snappymail/snappymail/v/2.38.2/themes/Default/styles.css /snappymail/snappymail/v/2.38.2/themes/Default/images/tlao-mark.svg

ENTRYPOINT ["/usr/local/bin/tlao-snappymail-entrypoint.sh"]

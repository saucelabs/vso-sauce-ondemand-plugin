/* eslint-env browser, es6 */
/* global VSS */
const getParams = query => {
  if (!query) {
    return { };
  }

  return (/^[?#]/.test(query) ? query.slice(1) : query)
    .split('&')
    .reduce((params, param) => {
      let [key, value] = param.split('=');
      params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
      return params;
    }, { });
};
const params = getParams(window.location.search);
var s = document.createElement('script');
s.type = 'text/javascript';
s.src = params.auth;
document.body.appendChild(s);


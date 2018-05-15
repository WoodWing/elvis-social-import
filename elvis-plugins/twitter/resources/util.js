class Util {

  static get BASE_URL() {
    return '${serverUrl}/plugins/social_api/topics';
  }

  static get ENTITY_MAP() {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
  }

  static escapeHtml (string) {
    return String(string).replace(/[&<>"'`=\/]/g, (s) => {
      return ENTITY_MAP[s];
    });
  }

  static callSocialApi(elvisApi, params) {
    elvisApi.csrf((data) => {
      if (!params.headers) {
        params.headers = {};
      }      
      params.headers['X-CSRF-TOKEN'] = data.csrfToken;
      if (!params.contentType) {
        params.contentType = 'application/json; charset=utf-8';
      }
      if (!params.dataType) {
        params.dataType = 'json';
      }
      params.error = (jqXHR, textStatus, error) => {
        console.log('API request failed: ' + JSON.stringify(jqXHR));
      };
      $.ajax(params);
    });
  }
}

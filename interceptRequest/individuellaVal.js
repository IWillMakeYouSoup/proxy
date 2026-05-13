export default [
  {
    name: 'individuellaVal',

    // match: { method: 'GET', path: '/api/individer' },
    match: { method: 'GET', path: '/v1/mojligaplaceringsval' },

    transform(axiosConfig) {
      // -----------------------------------------------------------------
      // HEADERS
      // -----------------------------------------------------------------
      // Add or overwrite a request header:
      //   axiosConfig.headers['x-my-header'] = 'value';
      //
      // Remove a header:
      //   delete axiosConfig.headers['x-remove-me'];

      axiosConfig.headers['x-intercepted-by'] = 'individuellaVal';

      // -----------------------------------------------------------------
      // BODY (POST / PUT / PATCH)
      // -----------------------------------------------------------------
      // axiosConfig.data is the request body as sent to upstream.
      //
      // Inject a field into an existing JSON body:
      //   axiosConfig.data = { ...axiosConfig.data, extraField: 'value' };
      //
      // Replace the body entirely:
      //   axiosConfig.data = { foo: 'bar' };
      //
      // Remove a field:
      //   const { sensitiveField, ...rest } = axiosConfig.data;
      //   axiosConfig.data = rest;

      // -----------------------------------------------------------------
      // URL / PATH
      // -----------------------------------------------------------------
      // Rewrite a path segment:
      //   axiosConfig.url = axiosConfig.url.replace('/v1/', '/v2/');

      // -----------------------------------------------------------------
      // QUERY PARAMS
      // -----------------------------------------------------------------
      // Add or overwrite a query param:
      //   axiosConfig.params = { ...axiosConfig.params, debug: 'true' };
      //
      // Remove a query param:
      //   const { unwanted, ...rest } = axiosConfig.params ?? {};
      //   axiosConfig.params = rest;

      return axiosConfig;
    },
  },
];

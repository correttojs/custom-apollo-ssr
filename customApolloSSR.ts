import crypto from "crypto";

import ApolloClient, { OperationVariables, QueryOptions } from "apollo-client";
import { addTypenameToDocument } from "apollo-utilities";
import type { DocumentNode } from "graphql";
import { print } from "graphql/language/printer";

import { NormalizedCacheObject, InMemoryCache } from "apollo-cache-inmemory";
import { createHttpLink } from "apollo-link-http";

const sha256Hash = (query: DocumentNode) => {
  return crypto.createHash("sha256").update(print(query)).digest("hex");
};

const GQL_ENDPOINT = "https://countries.trevorblades.com";

export const getApollo = (initialState?: NormalizedCacheObject) => {
  const httpLink = createHttpLink({
    uri: GQL_ENDPOINT,
    fetch,
  });
  const cache = new InMemoryCache().restore(initialState);
  return new ApolloClient({
    link: httpLink,
    cache,
  });
};

const execQuery = async <TVariables = OperationVariables>(
  options: QueryOptions<TVariables>,
  customHeaders: { [key: string]: string }
) => {
  const url = new URL(GQL_ENDPOINT);
  const query = addTypenameToDocument(options.query);

  const operationName = query?.definitions?.[0]?.["name"]?.["value"];
  const params = {
    extensions: JSON.stringify({
      persistedQuery: { version: 1, sha256Hash: sha256Hash(query) },
    }),
    operationName,
    variables: JSON.stringify(options.variables),
  };
  Object.keys(params).forEach((key) =>
    url.searchParams.append(key, params[key])
  );
  const headers = {
    accept: "*/*",
    "content-type": "application/json",
    ...customHeaders,
  };
  let data = await fetch(url.toString(), {
    headers,
    method: "GET",
  }).then((r) => r.json());

  if (
    data.errors?.[0]?.message === "PersistedQueryNotFound" ||
    data.errors?.[0]?.message === "PersistedQueryNotSupported"
  ) {
    data = await fetch(GQL_ENDPOINT, {
      headers,
      body: JSON.stringify({
        query: print(query),
        operationName,
        variables: options.variables,
      }),
      method: "POST",
    }).then((r) => r.json());
  }
  return data;
};

export const createApolloClientSSR = (customHeaders: {
  [key: string]: string;
}) => {
  const apolloClient = getApollo({});

  return {
    query: async <TVariables = OperationVariables>(
      options: QueryOptions<TVariables>
    ) => {
      try {
        const data = await execQuery(options, customHeaders);
        apolloClient.cache.write({
          result: data.data,
          dataId: "ROOT_QUERY",
          query: options.query,
          variables: options.variables,
        });
        return { data: data.data, error: data.errors };
      } catch (error) {
        return { error, data: null };
      }
    },
    cache: apolloClient.cache,
  };
};

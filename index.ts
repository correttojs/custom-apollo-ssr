import { createApolloClientSSR } from "./customApolloSSR";
import gql from "graphql-tag";

export const runSSRRequest = async () => {
  const client = createApolloClientSSR({});
  await client.query({
    query: gql`
      query getCountries {
        countries {
          name
          phone
        }
      }
    `,
  });
  return client.cache.extract();
};

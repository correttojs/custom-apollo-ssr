import { createApolloClientSSR, getApollo } from "../customApolloSSR";
import gql from "graphql-tag";
import { NextPage } from "next";
import { ApolloProvider, useQuery } from "@apollo/react-hooks";

const QUERY = gql`
  query getCountries {
    countries {
      name
      phone
    }
  }
`;

function HomePage() {
  const { data } = useQuery(QUERY);
  return <div>Welcome to Next.js! {data?.countries?.[0]?.name}</div>;
}

const withApollo = (Comp: NextPage) => (props) => {
  return (
    <ApolloProvider client={getApollo(props.apolloState)}>
      <Comp />
    </ApolloProvider>
  );
};

export async function getServerSideProps(context) {
  const client = createApolloClientSSR({});
  await client.query({
    query: QUERY,
  });
  const apolloState = client.cache.extract();
  return {
    props: {
      apolloState: client.cache.extract(),
    },
  };
}

export default withApollo(HomePage);

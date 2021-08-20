import "./App.css";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import  Home  from "./Pages/Home";

function App() {
  const client = new ApolloClient({
    uri: "https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql",
    cache: new InMemoryCache()
  });

  return (
    <ApolloProvider client={client}>
      <Home />
    </ApolloProvider>
  );
}

export default App;

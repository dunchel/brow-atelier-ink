const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const storefrontAccessToken =
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

const STOREFRONT_URL = `https://${domain}/api/2025-01/graphql.json`;

async function storeFetch(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Shopify API fout (${res.status})`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message ?? "Onbekende fout");
  }

  return json;
}

export interface CustomerInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  orders: {
    edges: {
      node: {
        id: string;
        orderNumber: number;
        processedAt: string;
        totalPrice: { amount: string; currencyCode: string };
        fulfillmentStatus: string;
        lineItems: {
          edges: {
            node: {
              title: string;
              quantity: number;
            };
          }[];
        };
      };
    }[];
  };
  addresses: {
    edges: {
      node: {
        id: string;
        address1: string;
        city: string;
        zip: string;
        country: string;
      };
    }[];
  };
}

export async function createCustomer(
  email: string,
  password: string,
  firstName: string,
  lastName: string
) {
  const { data } = await storeFetch(
    `mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer { id email firstName lastName }
        customerUserErrors { field message code }
      }
    }`,
    { input: { email, password, firstName, lastName } }
  );

  const errors = data?.customerCreate?.customerUserErrors;
  if (errors?.length) {
    throw new Error(getCustomerError(errors));
  }

  return data.customerCreate.customer;
}

const customerErrorMessages: Record<string, string> = {
  UNIDENTIFIED_CUSTOMER: "E-mailadres of wachtwoord is onjuist.",
  CUSTOMER_DISABLED: "Dit account is gedeactiveerd. Neem contact met ons op.",
  TOO_MANY_REQUESTS: "Te veel pogingen. Probeer het later opnieuw.",
  TAKEN: "Dit e-mailadres is al in gebruik.",
  TOO_SHORT: "Wachtwoord moet minimaal 5 tekens lang zijn.",
  BLANK: "Dit veld is verplicht.",
};

function getCustomerError(errors: { message: string; code: string }[]): string {
  if (!errors?.length) return "Er ging iets mis";
  const code = errors[0].code;
  return customerErrorMessages[code] ?? errors[0].message;
}

export async function loginCustomer(email: string, password: string) {
  const { data } = await storeFetch(
    `mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken {
          accessToken
          expiresAt
        }
        customerUserErrors { field message code }
      }
    }`,
    { input: { email, password } }
  );

  const errors = data?.customerAccessTokenCreate?.customerUserErrors;
  if (errors?.length) {
    throw new Error(getCustomerError(errors));
  }

  return data.customerAccessTokenCreate.customerAccessToken;
}

export async function getCustomer(accessToken: string): Promise<CustomerInfo | null> {
  const { data } = await storeFetch(
    `query getCustomer($token: String!) {
      customer(customerAccessToken: $token) {
        id
        firstName
        lastName
        email
        phone
        orders(first: 10, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id
              orderNumber
              processedAt
              totalPrice { amount currencyCode }
              fulfillmentStatus
              lineItems(first: 5) {
                edges {
                  node { title quantity }
                }
              }
            }
          }
        }
        addresses(first: 5) {
          edges {
            node {
              id
              address1
              city
              zip
              country
            }
          }
        }
      }
    }`,
    { token: accessToken }
  );

  return data?.customer ?? null;
}

export async function recoverCustomer(email: string) {
  const { data } = await storeFetch(
    `mutation customerRecover($email: String!) {
      customerRecover(email: $email) {
        customerUserErrors { field message code }
      }
    }`,
    { email }
  );

  const errors = data?.customerRecover?.customerUserErrors;
  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  return true;
}

export async function resetCustomerPassword(customerId: string, resetToken: string, password: string) {
  const id = customerId.startsWith("gid://")
    ? customerId
    : `gid://shopify/Customer/${customerId}`;

  const { data } = await storeFetch(
    `mutation customerReset($id: ID!, $input: CustomerResetInput!) {
      customerReset(id: $id, input: $input) {
        customerAccessToken {
          accessToken
          expiresAt
        }
        customerUserErrors { field message code }
      }
    }`,
    { id, input: { resetToken, password } }
  );

  const errors = data?.customerReset?.customerUserErrors;
  if (errors?.length) {
    throw new Error(getCustomerError(errors));
  }

  return data.customerReset.customerAccessToken;
}

import { NextRequest, NextResponse } from 'next/server'
import API, { MatchFilter } from '@searchkit/api'

const apiClient = API(
  {
    connection: {
      // Note the index is defined in page.tsx <InstantSearch indexName="convsrv" searchClient={searchClient} routing>
      host: 'http://localhost:9200', 
      //auth: {
      //  username: "elastic",
      //  password: "changeme"
      //},
    },
    search_settings: {
      highlight_attributes: ['title'],
      snippet_attributes: ['data:400','fileName','author','numberOfPages'],
      search_attributes: [
        { field: 'title', weight: 3 },
        { field: 'fileName', weight: 1 },
        { field: 'author', weight: 1 },
        'data'
      ],
      result_attributes: [
        'title',
        'fileName',
        'data',
        'author',
        'numberOfPages',
        'signatureFieldExists',
        'creator',
        'producer'
      ],
      facet_attributes: [
        {
          attribute: 'numberOfPages',
          field: 'numberOfPages',
          type: 'numeric'
        },
        {
          attribute: 'author',
          field: 'author',
          type: 'string'
        },
        {
          attribute: 'conformance',
          field: 'conformance',
          type: 'string'
        },
        {
          attribute: 'fontNames',
          field: 'fontNames',
          type: 'string'
        }
      ],
      query_rules: [
        {
          id: 'default-state',
          conditions: [[]],
          actions: [
            {
              action: 'RenderFacetsOrder',
              facetAttributesOrder: [
                'conformance',
                'fontNames',
                'author',
                'numberOfPages',
                'signatureFieldExists',
                // 'creator',
                // 'producer'
              ]
            }
          ]
        }
      ]
    }
  },
  { debug: true }
)

export async function POST(req: NextRequest, res: NextResponse) {
  const data = await req.json()

  const results = await apiClient.handleRequest(data)
  return NextResponse.json(results)
}

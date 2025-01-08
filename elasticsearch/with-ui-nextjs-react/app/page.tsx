'use client'
import {
  InstantSearch,
  SearchBox,
  Hits,
  Highlight,
  RefinementList,
  Pagination,
  Stats,
  Snippet,
  CurrentRefinements,
  HierarchicalMenu,
  Configure,
  DynamicWidgets,
  RangeInput,
  useQueryRules
} from 'react-instantsearch'

import Client from '@searchkit/instantsearch-client'

const searchClient = Client({
  url: '/api/search'
})

const HitView = (props: any) => {
  return (
    <div>
      <div className="hit__details">
        <h2>
          <Highlight attribute="title" hit={props.hit} />
        </h2>
        <p><pre><Snippet attribute="fileName" hit={props.hit} /> - <Snippet attribute="author" hit={props.hit} /> - <Snippet attribute="numberOfPages" hit={props.hit} /> pages</pre></p>
        <Snippet attribute="data" hit={props.hit} />        
      </div>
    </div>
  )
}

const Panel = ({ header, children }: any) => (
  <div className="panel">
    <h5>{header}</h5>
    {children}
  </div>
)

const QueryRulesBanner = () => {
  const { items } = useQueryRules({})
  if (items.length === 0) {
    return null
  }

  return (
    <div className="query-rules">
      {items.map((item) => (
        <div key={item.objectID} className="query-rules__item">
          <a href={item.url}>
            <b className="query-rules__item-title">{item.title}</b>
            <span className="query-rules__item-description">{item.body}</span>
          </a>
        </div>
      ))}
    </div>
  )
}

export default function Web() {
  return (
    <div className="">
      <InstantSearch indexName="convsrv" searchClient={searchClient} routing>
        <Configure hitsPerPage={15} />
        <div className="container">
          <div className="search-panel">
            <div className="search-panel__filters">
              <DynamicWidgets facets={['*']}>
                <Panel header="PDF Conformance Level">
                  <RefinementList attribute="conformance" />
                </Panel>
                <Panel header="Fonts">
                  <RefinementList attribute="fontNames" searchable />
                </Panel>
                <Panel header="Author">
                  <RefinementList attribute="author" searchable />
                </Panel>
                <Panel header="Creator">
                  <RefinementList attribute="creator" />
                </Panel>
                <Panel header="Producer">
                  <RefinementList attribute="producer" />
                </Panel>
                <Panel header="Number of Pages">
                  <RangeInput attribute="numberOfPages" />
                </Panel>
              </DynamicWidgets>
            </div>
            <div className="search-panel__results">
              <div className="searchbox">
                <SearchBox />
              </div>

              <Stats />
              <CurrentRefinements />
              <QueryRulesBanner />

              <Hits hitComponent={HitView} />
              <Pagination />
            </div>
          </div>
        </div>
      </InstantSearch>
    </div>
  )
}

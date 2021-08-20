import React, { useMemo, useState, useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import { GET_JOURNEY_QUERY } from "../GraphQL/Queries";
import styled from 'styled-components';
import Table from './Table'
import  Spinner  from "../Spinner";

const Styles = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }
`;

function serialize(obj, prefix) {
  if (!obj) {
    return "";
  }

  return Object.keys(obj)
    .map((p) => {
      const k = prefix || p;
      const v = obj[p];

      return typeof v === "object"
        ? serialize(v, k)
        : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
    })
    .join("&");
}

// Return Promise for a url json get request
function getJson(url, params) {
  return fetch(
    encodeURI(url) +
      (params ? (url.search(/\?/) === -1 ? "?" : "&") + serialize(params) : ""),
    {
      timeout: 10000,
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  ).then((res) => res.json());
}

function getGeocodingResult(_text) {
  const text = _text ? _text.trim() : null;
  if (text === undefined || text === null || text.length < 1) {
    return Promise.resolve([]);
  }
  let opts = { text };

  return getJson(`http://api.digitransit.fi/geocoding/v1/search`, opts).then(
    response => response.features,
  );
}


function parseGeocodingResults(results) {
  if (!Array.isArray(results) || results.length < 1) {
    return " ";
  }
  return locationToOTP({
    address: results[0].properties.label,
    lon: results[0].geometry.coordinates[0],
    lat: results[0].geometry.coordinates[1],
  });
}

const locationToOTP = (location) => {
  return `${location.address}::${location.lat},${location.lon}`;
};

function Home() {
  const [destinationJourneySearched, setDestinationJourneySearched] =
    useState("");
  const [appState, setAppState] = useState("");
  
    const columns = useMemo(
      () => [
        {
          id: "expander", 
          Header: ({ getToggleAllRowsExpandedProps, isAllRowsExpanded }) => (
            <span {...getToggleAllRowsExpandedProps()}>
              {isAllRowsExpanded ? "👇" : "👉"}
            </span>
          ),
          Cell: ({ row }) =>
            row.canExpand ? 
            (
              <span
                {...row.getToggleRowExpandedProps({
                  style: {
                    paddingLeft: `${row.depth * 2}rem`
                  }
                })}
              >
                {row.isExpanded ? "👇" : "👉"}
              </span>
            ) 
            : null
        },
        {
          Header: "Journey Planner from Pohjoinen Rautatiekatu 25, Helsinki",
          columns: [
            {
              Header: "Duration",
              accessor: "duration"
            },
            {
              Header: "From",
              accessor: (d)=> d.From
            },
            {
              Header: "Start time",
              accessor: (d)=> d.startTime
            },
            {
              Header: "To",
              accessor: (d)=> d.To
            },
            {
              Header: "End time",
              accessor: (d)=> d.endTime
            }
            ,
            {
              Header: "Distance",
              accessor: (d)=> d.Distance
            }
            ,
            {
              Header: "Mode of transportation",
              accessor: (d)=> d.Mode
            },
          ]
        },
      ],
      []
    );
  useEffect(() => {
    getGeocodingResult(destinationJourneySearched)
      .then(parseGeocodingResults)
      .then(function aa(result) {
        setAppState(result);
      })
      .catch(() => " ");
    return () => {
    }
  },[destinationJourneySearched])

  const [getJourney, { loading, data, error }] = useLazyQuery(
    GET_JOURNEY_QUERY,
    {
      variables: {fromPlace: "Pohjoinen Rautatiekatu 25, Helsinki::60.169394,24.925753", toPlace: appState},
      // variables: {
      //   fromPlace: "Kamppiaistie 2, Helsinki::60.242532,24.921021",
      //   toPlace: "Pohjoinen Rautatiekatu 25, Helsinki::60.169443,24.926077",
      // },
    }
  );

  if (loading) return <Spinner />;
  if (error) return <pre>{error.message}</pre>;

  let results123 = []
  if(data){
    results123 = data.plan.itineraries.reduce((list, itinerary) => {
      const _itinerary = {
          duration: (itinerary.duration / 60).toFixed(2) + ' min',
          walkDistance: (itinerary.walkDistance / 1000).toFixed(2) + ' km',
          subRows: []
      }
      _itinerary.subRows = itinerary.legs.map(leg => {
          let startTimeHours = (new Date(leg.startTime).getHours()) % 24;
          startTimeHours = startTimeHours < 10 ? '0'+startTimeHours : startTimeHours;
          let startTimeMins = (new Date(leg.startTime).getMinutes()) % 60;
          startTimeMins = startTimeMins < 10 ? '0'+startTimeMins : startTimeMins;

          let endTimeHours = (new Date(leg.endTime).getHours()) % 24;
          endTimeHours = startTimeHours < 10 ? '0'+endTimeHours : endTimeHours;
          let endTimeMins = (new Date(leg.endTime).getMinutes()) % 60;
          endTimeMins = endTimeMins < 10 ? '0'+endTimeMins : endTimeMins;

          return {
              From: leg.from.name,
              startTime: startTimeHours+':'+startTimeMins,
              To: leg.to.name,
              endTime: endTimeHours+':'+endTimeMins,
              Distance: (leg.distance / 1000).toFixed(2) + ' km',
              Mode: leg.mode,
          }
      });
      list.push(_itinerary)
      return list;
  }, []);
  }
  
  
  return (
    <div className="home">
      <h1>Journey Planner</h1>
      <input
        type="text"
        placeholder="Enter destination"
        onChange={(event) => {
          event.preventDefault();
          setDestinationJourneySearched(event.target.value);
        }}
        value={destinationJourneySearched}
      />
      <button onClick={() => getJourney()}>Journey</button>
      <Styles>
        <Table columns={columns} data={results123} />
      </Styles>
    </div>
  );
}

export default Home;

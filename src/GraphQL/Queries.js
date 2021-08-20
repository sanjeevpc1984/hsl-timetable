import { gql } from "@apollo/client";

export const GET_JOURNEY_QUERY = gql`
  query plan($fromPlace: String, $toPlace: String){
    plan(
      fromPlace: $fromPlace,
      toPlace: $toPlace,
    ) {
      itineraries{
        walkDistance,
        duration,
        legs {
          mode
          startTime
          endTime
          from {
            lat
            lon
            name
            stop {
              code
              name
            }
          },
          to {
            lat
            lon
            name
          },
          agency {
            gtfsId
      name
          },
          distance
          legGeometry {
            length
            points
          }
        }
      }
    }
  }
`;

import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { NorwayWeatherSegments } from './NorwayWeatherSegments.js';
import type { MainFuelV2 } from './MainFuelV2.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition, ObjectMetadata as $ObjectMetadata } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType } from '@osdk/client';
export declare namespace MainFlightObjectFp2 {
    type PropertyKeys = 'captainId' | 'copilotId' | 'destinationSunrise' | 'soId' | 'totalDistanceOutboundAndAlternate' | 'flightNumber' | 'medicName' | 'displayWaypoints' | 'alternate' | 'destinationSunset' | 'logId' | 'totalDistanceNoAlternate' | 'alternateName' | 'weatherWarnings' | 'additionalCrew' | 'copilot' | 'combinedWaypoints' | 'updatedAt' | 'createdBy' | 'departureGeoPoint' | 'stopsArray' | 'avgWindSpeed' | 'soName' | 'aircraftId' | 'fullRouteGeoShape' | 'flightId' | 'fuelPlanId' | 'captain' | 'etd' | 'alternateGeoPoint' | 'destinationGeoPoint' | 'alternateLegIds' | 'alternateSunrise' | 'rswId' | 'policyUuid' | 'createdAt' | 'departureSunrise' | 'totalFlightTime' | 'medicId' | 'region' | 'avgWindDirection' | 'legsNames' | 'rswName' | 'timingId' | 'legIds' | 'totalMinFlightTimeToAlternate' | 'weightBalanceId' | 'alternateFullRouteGeoShape' | 'alternateSplitPoint' | 'departureSunset' | 'alternateSunset' | 'totalFlightTimeWithStops' | 'legs';
    interface Links {
        readonly mainFuelV2s: MainFuelV2.ObjectSet;
        readonly weatherSegments: NorwayWeatherSegments.ObjectSet;
    }
    interface Props {
        readonly additionalCrew: $PropType['string'] | undefined;
        readonly aircraftId: $PropType['string'] | undefined;
        readonly alternate: $PropType['string'][] | undefined;
        readonly alternateFullRouteGeoShape: $PropType['geoshape'] | undefined;
        readonly alternateGeoPoint: $PropType['string'] | undefined;
        readonly alternateLegIds: $PropType['string'][] | undefined;
        readonly alternateName: $PropType['string'] | undefined;
        readonly alternateSplitPoint: $PropType['string'] | undefined;
        readonly alternateSunrise: $PropType['timestamp'] | undefined;
        readonly alternateSunset: $PropType['timestamp'] | undefined;
        readonly avgWindDirection: $PropType['double'] | undefined;
        readonly avgWindSpeed: $PropType['double'] | undefined;
        readonly captain: $PropType['string'] | undefined;
        readonly captainId: $PropType['string'] | undefined;
        readonly combinedWaypoints: $PropType['string'][] | undefined;
        readonly copilot: $PropType['string'] | undefined;
        readonly copilotId: $PropType['string'] | undefined;
        readonly createdAt: $PropType['timestamp'] | undefined;
        readonly createdBy: $PropType['string'] | undefined;
        readonly departureGeoPoint: $PropType['string'] | undefined;
        readonly departureSunrise: $PropType['timestamp'] | undefined;
        readonly departureSunset: $PropType['timestamp'] | undefined;
        readonly destinationGeoPoint: $PropType['string'] | undefined;
        readonly destinationSunrise: $PropType['timestamp'] | undefined;
        readonly destinationSunset: $PropType['timestamp'] | undefined;
        readonly displayWaypoints: $PropType['string'][] | undefined;
        readonly etd: $PropType['timestamp'] | undefined;
        readonly flightId: $PropType['string'];
        readonly flightNumber: $PropType['string'] | undefined;
        readonly fuelPlanId: $PropType['string'] | undefined;
        readonly fullRouteGeoShape: $PropType['geoshape'] | undefined;
        readonly legIds: $PropType['string'][] | undefined;
        readonly legs: $PropType['string'][] | undefined;
        readonly legsNames: $PropType['string'][] | undefined;
        readonly logId: $PropType['string'] | undefined;
        readonly medicId: $PropType['string'] | undefined;
        readonly medicName: $PropType['string'] | undefined;
        readonly policyUuid: $PropType['string'] | undefined;
        readonly region: $PropType['string'] | undefined;
        readonly rswId: $PropType['string'] | undefined;
        readonly rswName: $PropType['string'] | undefined;
        readonly soId: $PropType['string'] | undefined;
        readonly soName: $PropType['string'] | undefined;
        readonly stopsArray: $PropType['string'][] | undefined;
        readonly timingId: $PropType['string'] | undefined;
        readonly totalDistanceNoAlternate: $PropType['double'] | undefined;
        readonly totalDistanceOutboundAndAlternate: $PropType['double'] | undefined;
        readonly totalFlightTime: $PropType['double'] | undefined;
        readonly totalFlightTimeWithStops: $PropType['double'] | undefined;
        readonly totalMinFlightTimeToAlternate: $PropType['double'] | undefined;
        readonly updatedAt: $PropType['timestamp'] | undefined;
        readonly weatherWarnings: $PropType['string'] | undefined;
        readonly weightBalanceId: $PropType['string'] | undefined;
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<MainFlightObjectFp2, MainFlightObjectFp2.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof MainFlightObjectFp2.Props = keyof MainFlightObjectFp2.Props> = $Osdk.Instance<MainFlightObjectFp2, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof MainFlightObjectFp2.Props = keyof MainFlightObjectFp2.Props> = OsdkInstance<OPTIONS, K>;
}
export interface MainFlightObjectFp2 extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'MainFlightObjectFp2';
    __DefinitionMetadata?: {
        objectSet: MainFlightObjectFp2.ObjectSet;
        props: MainFlightObjectFp2.Props;
        linksType: MainFlightObjectFp2.Links;
        strictProps: MainFlightObjectFp2.StrictProps;
        apiName: 'MainFlightObjectFp2';
        description: 'Main Flight Object FP2 ';
        displayName: 'Main Flight Object FP2 ';
        icon: {
            type: 'blueprint';
            color: '#3FA6DA';
            name: 'airplane';
        };
        implements: [];
        interfaceMap: {};
        inverseInterfaceMap: {};
        links: {
            mainFuelV2s: $ObjectMetadata.Link<MainFuelV2, true>;
            weatherSegments: $ObjectMetadata.Link<NorwayWeatherSegments, true>;
        };
        pluralDisplayName: 'Main Flight Object FP2s';
        primaryKeyApiName: 'flightId';
        primaryKeyType: 'string';
        properties: {
            /**
             *   display name: 'Additional Crew'
             */
            additionalCrew: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Aircraft Id'
             */
            aircraftId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Alternate'
             */
            alternate: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             *   display name: 'Alternate Full Route Geo Shape'
             */
            alternateFullRouteGeoShape: $PropertyDef<'geoshape', 'nullable', 'single'>;
            /**
             *   display name: 'Alternate Geo Point'
             */
            alternateGeoPoint: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Alternate Leg Ids'
             */
            alternateLegIds: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             *   display name: 'Alternate Name'
             */
            alternateName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            alternateSplitPoint: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Alternate Sunrise'
             */
            alternateSunrise: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             *   display name: 'Alternate Sunset'
             */
            alternateSunset: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            avgWindDirection: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            avgWindSpeed: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'Captain'
             */
            captain: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: ' captainId'
             */
            captainId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Combined Waypoints'
             */
            combinedWaypoints: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             *   display name: 'Copilot'
             */
            copilot: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            copilotId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Created At'
             */
            createdAt: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             *   display name: 'Created By'
             */
            createdBy: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Departure Geo Point'
             */
            departureGeoPoint: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Departure Sunrise'
             */
            departureSunrise: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             *   display name: 'Departure Sunset'
             */
            departureSunset: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             *   display name: 'Destination Geo Point'
             */
            destinationGeoPoint: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Destination Sunrise'
             */
            destinationSunrise: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             *   display name: 'Destination Sunset'
             */
            destinationSunset: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            displayWaypoints: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             *   display name: 'Etd'
             */
            etd: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             *   display name: 'Flight Id'
             */
            flightId: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             *   display name: 'Flight Number'
             */
            flightNumber: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Fuel Plan Id'
             */
            fuelPlanId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Full Route Geo Shape'
             */
            fullRouteGeoShape: $PropertyDef<'geoshape', 'nullable', 'single'>;
            /**
             *   display name: 'Leg Ids'
             */
            legIds: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             *   display name: 'Legs'
             */
            legs: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             *   display name: 'Legs Names'
             */
            legsNames: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             *   display name: 'Log Id'
             */
            logId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            medicId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            medicName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Policy Uuid'
             */
            policyUuid: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Region'
             */
            region: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            rswId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            rswName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            soId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            soName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            stopsArray: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             *   display name: 'Timing Id'
             */
            timingId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Total Distance No Alternate'
             */
            totalDistanceNoAlternate: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'Total Distance Outbound And Alternate'
             */
            totalDistanceOutboundAndAlternate: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'Total Flight Time'
             */
            totalFlightTime: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'Total Flight Time With Stops'
             */
            totalFlightTimeWithStops: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'Total Min Flight Time To Alternate'
             */
            totalMinFlightTimeToAlternate: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'Updated At'
             */
            updatedAt: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            weatherWarnings: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Weight Balance Id'
             */
            weightBalanceId: $PropertyDef<'string', 'nullable', 'single'>;
        };
        rid: 'ri.ontology.main.object-type.b0100bc5-39d5-4e0a-9f5e-b757c7de9968';
        status: 'EXPERIMENTAL';
        titleProperty: 'flightNumber';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const MainFlightObjectFp2: MainFlightObjectFp2;

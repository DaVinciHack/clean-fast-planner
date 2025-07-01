import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { NorwayWeatherSegments } from './NorwayWeatherSegments.js';
import type { MainFuelV2 } from './MainFuelV2.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition, ObjectMetadata as $ObjectMetadata } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType } from '@osdk/client';
export declare namespace MainFlightObjectFp2 {
    type PropertyKeys = 'captainId' | 'copilotId' | 'destinationSunrise' | 'soId' | 'totalDistanceOutboundAndAlternate' | 'flightNumber' | 'medicName' | 'displayWaypoints' | 'cancellationReason' | 'alternate' | 'destinationSunset' | 'logId' | 'totalDistanceNoAlternate' | 'cancellationTime' | 'assetIdx' | 'alternateName' | 'weatherWarnings' | 'additionalCrew' | 'copilot' | 'combinedWaypoints' | 'updatedAt' | 'createdBy' | 'departureGeoPoint' | 'stopsArray' | 'avgWindSpeed' | 'cancellationPenaltyIndicator' | 'soName' | 'aircraftId' | 'fullRouteGeoShape' | 'eta' | 'flightId' | 'fuelPlanId' | 'captain' | 'etd' | 'alternateGeoPoint' | 'destinationGeoPoint' | 'alternateLegIds' | 'alternateSunrise' | 'rswId' | 'flightStatus' | 'flightType' | 'jobIdx' | 'policyUuid' | 'createdAt' | 'departureSunrise' | 'totalFlightTime' | 'medicId' | 'region' | 'avgWindDirection' | 'legsNames' | 'rswName' | 'timingId' | 'baggageWeight' | 'legIds' | 'totalMinFlightTimeToAlternate' | 'weightBalanceId' | 'alternateFullRouteGeoShape' | 'alternateSplitPoint' | 'departureSunset' | 'alternateSunset' | 'totalFlightTimeWithStops' | 'legs';
    interface Links {
        readonly mainFuelV2s: MainFuelV2.ObjectSet;
        readonly weatherSegments: NorwayWeatherSegments.ObjectSet;
    }
    interface Props {
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Additional Crew'
         */
        readonly additionalCrew: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Aircraft Id'
         */
        readonly aircraftId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Alternate'
         */
        readonly alternate: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Alternate Full Route Geo Shape'
         */
        readonly alternateFullRouteGeoShape: $PropType['geoshape'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Alternate Geo Point'
         */
        readonly alternateGeoPoint: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Alternate Leg Ids'
         */
        readonly alternateLegIds: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Alternate Name'
         */
        readonly alternateName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly alternateSplitPoint: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Alternate Sunrise'
         */
        readonly alternateSunrise: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Alternate Sunset'
         */
        readonly alternateSunset: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'AssetIdx'
         */
        readonly assetIdx: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly avgWindDirection: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly avgWindSpeed: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Baggage Weight'
         */
        readonly baggageWeight: $PropType['float'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Cancellation Penalty Indicator'
         */
        readonly cancellationPenaltyIndicator: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Cancellation Reason'
         */
        readonly cancellationReason: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Cancellation Time'
         */
        readonly cancellationTime: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Captain'
         */
        readonly captain: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: ' captainId'
         */
        readonly captainId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Combined Waypoints'
         */
        readonly combinedWaypoints: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Copilot'
         */
        readonly copilot: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly copilotId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Created At'
         */
        readonly createdAt: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Created By'
         */
        readonly createdBy: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Departure Geo Point'
         */
        readonly departureGeoPoint: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Departure Sunrise'
         */
        readonly departureSunrise: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Departure Sunset'
         */
        readonly departureSunset: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Destination Geo Point'
         */
        readonly destinationGeoPoint: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Destination Sunrise'
         */
        readonly destinationSunrise: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Destination Sunset'
         */
        readonly destinationSunset: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly displayWaypoints: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Eta'
         */
        readonly eta: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Etd'
         */
        readonly etd: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Flight Id'
         */
        readonly flightId: $PropType['string'];
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Flight Number'
         */
        readonly flightNumber: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Flight Status'
         */
        readonly flightStatus: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Flight Type'
         */
        readonly flightType: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Fuel Plan Id'
         */
        readonly fuelPlanId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Full Route Geo Shape'
         */
        readonly fullRouteGeoShape: $PropType['geoshape'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly jobIdx: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Leg Ids'
         */
        readonly legIds: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Legs'
         */
        readonly legs: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Legs Names'
         */
        readonly legsNames: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Log Id'
         */
        readonly logId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly medicId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly medicName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Policy Uuid'
         */
        readonly policyUuid: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Region'
         */
        readonly region: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly rswId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly rswName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly soId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly soName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly stopsArray: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Timing Id'
         */
        readonly timingId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Total Distance No Alternate'
         */
        readonly totalDistanceNoAlternate: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Total Distance Outbound And Alternate'
         */
        readonly totalDistanceOutboundAndAlternate: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Total Flight Time'
         */
        readonly totalFlightTime: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Total Flight Time With Stops'
         */
        readonly totalFlightTimeWithStops: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Total Min Flight Time To Alternate'
         */
        readonly totalMinFlightTimeToAlternate: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Updated At'
         */
        readonly updatedAt: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly weatherWarnings: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Weight Balance Id'
         */
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
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Additional Crew'
             */
            additionalCrew: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Aircraft Id'
             */
            aircraftId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Alternate'
             */
            alternate: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Alternate Full Route Geo Shape'
             */
            alternateFullRouteGeoShape: $PropertyDef<'geoshape', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Alternate Geo Point'
             */
            alternateGeoPoint: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Alternate Leg Ids'
             */
            alternateLegIds: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Alternate Name'
             */
            alternateName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            alternateSplitPoint: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Alternate Sunrise'
             */
            alternateSunrise: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Alternate Sunset'
             */
            alternateSunset: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'AssetIdx'
             */
            assetIdx: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            avgWindDirection: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            avgWindSpeed: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Baggage Weight'
             */
            baggageWeight: $PropertyDef<'float', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Cancellation Penalty Indicator'
             */
            cancellationPenaltyIndicator: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Cancellation Reason'
             */
            cancellationReason: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Cancellation Time'
             */
            cancellationTime: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Captain'
             */
            captain: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: ' captainId'
             */
            captainId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Combined Waypoints'
             */
            combinedWaypoints: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Copilot'
             */
            copilot: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            copilotId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Created At'
             */
            createdAt: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Created By'
             */
            createdBy: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Departure Geo Point'
             */
            departureGeoPoint: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Departure Sunrise'
             */
            departureSunrise: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Departure Sunset'
             */
            departureSunset: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Destination Geo Point'
             */
            destinationGeoPoint: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Destination Sunrise'
             */
            destinationSunrise: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Destination Sunset'
             */
            destinationSunset: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            displayWaypoints: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Eta'
             */
            eta: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Etd'
             */
            etd: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Flight Id'
             */
            flightId: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Flight Number'
             */
            flightNumber: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Flight Status'
             */
            flightStatus: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Flight Type'
             */
            flightType: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Fuel Plan Id'
             */
            fuelPlanId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Full Route Geo Shape'
             */
            fullRouteGeoShape: $PropertyDef<'geoshape', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            jobIdx: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Leg Ids'
             */
            legIds: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Legs'
             */
            legs: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Legs Names'
             */
            legsNames: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Log Id'
             */
            logId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            medicId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            medicName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Policy Uuid'
             */
            policyUuid: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Region'
             */
            region: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            rswId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            rswName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            soId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            soName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            stopsArray: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Timing Id'
             */
            timingId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Total Distance No Alternate'
             */
            totalDistanceNoAlternate: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Total Distance Outbound And Alternate'
             */
            totalDistanceOutboundAndAlternate: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Total Flight Time'
             */
            totalFlightTime: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Total Flight Time With Stops'
             */
            totalFlightTimeWithStops: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Total Min Flight Time To Alternate'
             */
            totalMinFlightTimeToAlternate: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Updated At'
             */
            updatedAt: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            weatherWarnings: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
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

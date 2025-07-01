import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { AllGtLocationsV2 } from './AllGtLocationsV2.js';
import type { MainFlightObjectFp2 } from './MainFlightObjectFp2.js';
import type { InternationalWeather } from './InternationalWeather.js';
import type { NorwayWeatherXv8 } from './NorwayWeatherXv8.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition, ObjectMetadata as $ObjectMetadata } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType, SingleLinkAccessor as $SingleLinkAccessor } from '@osdk/client';
export declare namespace NorwayWeatherSegments {
    type PropertyKeys = 'approachRanking' | 'crosswindComponent' | 'uniqueId' | 'araRequired' | 'geoPoint' | 'estimatedFlightTime' | 'alternateRanking' | 'isAlternateFor' | 'ranking9' | 'ranking8' | 'ranking7' | 'ranking6' | 'ranking5' | 'ranking4' | 'ranking3' | 'alternateBearing' | 'ranking2' | 'ranking1' | 'windDirection' | 'notams' | 'limitations' | 'ranking10' | 'isAccessible' | 'windSpeed' | 'airportRanking' | 'segment10' | 'isDaytime' | 'warnings' | 'deckReport' | 'flightUuid' | 'isRig' | 'distanceFromDeparture' | 'weatherSource' | 'distanceFromDestination' | 'sunset' | 'sunrise' | 'altRunway' | 'alternateGeoShape' | 'rawMetar' | 'rawTaf' | 'timestamp' | 'airportIcao' | 'segment1' | 'segment3' | 'segment2' | 'segment5' | 'segment4' | 'approachSegment' | 'segment7' | 'arrivalTime' | 'segment6' | 'altApproachType' | 'segment9' | 'segment8' | 'distanceForAlternate';
    interface Links {
        readonly allGtLocationsV2: $SingleLinkAccessor<AllGtLocationsV2>;
        readonly internationalWeather: $SingleLinkAccessor<InternationalWeather>;
        readonly mainFlightObjectFp2: $SingleLinkAccessor<MainFlightObjectFp2>;
        readonly norwayWeatherXv8: $SingleLinkAccessor<NorwayWeatherXv8>;
    }
    interface Props {
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Airport Icao',
         *
         *   description: weather segment location name
         */
        readonly airportIcao: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly airportRanking: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly altApproachType: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly alternateBearing: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly alternateGeoShape: $PropType['geoshape'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly alternateRanking: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly altRunway: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly approachRanking: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly approachSegment: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Ara Required'
         */
        readonly araRequired: $PropType['boolean'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Arrival Time'
         */
        readonly arrivalTime: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly crosswindComponent: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Deck Report'
         */
        readonly deckReport: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly distanceForAlternate: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly distanceFromDeparture: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly distanceFromDestination: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly estimatedFlightTime: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Flight Uuid'
         */
        readonly flightUuid: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Geo Point'
         */
        readonly geoPoint: $PropType['geopoint'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Is Accessible'
         */
        readonly isAccessible: $PropType['boolean'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly isAlternateFor: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Is Daytime'
         */
        readonly isDaytime: $PropType['boolean'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Is Rig'
         */
        readonly isRig: $PropType['boolean'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Limitations'
         */
        readonly limitations: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Notams'
         */
        readonly notams: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Ranking 1'
         */
        readonly ranking1: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Ranking 10'
         */
        readonly ranking10: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Ranking 2'
         */
        readonly ranking2: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Ranking 3'
         */
        readonly ranking3: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Ranking 4'
         */
        readonly ranking4: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Ranking 5'
         */
        readonly ranking5: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Ranking 6'
         */
        readonly ranking6: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Ranking 7'
         */
        readonly ranking7: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Ranking 8'
         */
        readonly ranking8: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Ranking 9'
         */
        readonly ranking9: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Raw Metar'
         */
        readonly rawMetar: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Raw Taf'
         */
        readonly rawTaf: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Segment 1'
         */
        readonly segment1: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Segment 10'
         */
        readonly segment10: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Segment 2'
         */
        readonly segment2: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Segment 3'
         */
        readonly segment3: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Segment 4'
         */
        readonly segment4: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Segment 5'
         */
        readonly segment5: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Segment 6'
         */
        readonly segment6: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Segment 7'
         */
        readonly segment7: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Segment 8'
         */
        readonly segment8: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Segment 9'
         */
        readonly segment9: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Sunrise'
         */
        readonly sunrise: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Sunset'
         */
        readonly sunset: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Timestamp'
         */
        readonly timestamp: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Unique ID'
         */
        readonly uniqueId: $PropType['string'];
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Warnings'
         */
        readonly warnings: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Weather Source'
         */
        readonly weatherSource: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly windDirection: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly windSpeed: $PropType['integer'] | undefined;
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<NorwayWeatherSegments, NorwayWeatherSegments.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof NorwayWeatherSegments.Props = keyof NorwayWeatherSegments.Props> = $Osdk.Instance<NorwayWeatherSegments, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof NorwayWeatherSegments.Props = keyof NorwayWeatherSegments.Props> = OsdkInstance<OPTIONS, K>;
}
export interface NorwayWeatherSegments extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'NorwayWeatherSegments';
    __DefinitionMetadata?: {
        objectSet: NorwayWeatherSegments.ObjectSet;
        props: NorwayWeatherSegments.Props;
        linksType: NorwayWeatherSegments.Links;
        strictProps: NorwayWeatherSegments.StrictProps;
        apiName: 'NorwayWeatherSegments';
        description: 'Norway weather segments colour coded for display';
        displayName: 'Weather segments';
        icon: {
            type: 'blueprint';
            color: '#F5498B';
            name: 'rain';
        };
        implements: [];
        interfaceMap: {};
        inverseInterfaceMap: {};
        links: {
            allGtLocationsV2: $ObjectMetadata.Link<AllGtLocationsV2, false>;
            internationalWeather: $ObjectMetadata.Link<InternationalWeather, false>;
            mainFlightObjectFp2: $ObjectMetadata.Link<MainFlightObjectFp2, false>;
            norwayWeatherXv8: $ObjectMetadata.Link<NorwayWeatherXv8, false>;
        };
        pluralDisplayName: 'Weather segments';
        primaryKeyApiName: 'uniqueId';
        primaryKeyType: 'string';
        properties: {
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Airport Icao',
             *
             *   description: weather segment location name
             */
            airportIcao: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            airportRanking: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            altApproachType: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            alternateBearing: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            alternateGeoShape: $PropertyDef<'geoshape', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            alternateRanking: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            altRunway: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            approachRanking: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            approachSegment: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Ara Required'
             */
            araRequired: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Arrival Time'
             */
            arrivalTime: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            crosswindComponent: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Deck Report'
             */
            deckReport: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            distanceForAlternate: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            distanceFromDeparture: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            distanceFromDestination: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            estimatedFlightTime: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Flight Uuid'
             */
            flightUuid: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Geo Point'
             */
            geoPoint: $PropertyDef<'geopoint', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Is Accessible'
             */
            isAccessible: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            isAlternateFor: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Is Daytime'
             */
            isDaytime: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Is Rig'
             */
            isRig: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Limitations'
             */
            limitations: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Notams'
             */
            notams: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Ranking 1'
             */
            ranking1: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Ranking 10'
             */
            ranking10: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Ranking 2'
             */
            ranking2: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Ranking 3'
             */
            ranking3: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Ranking 4'
             */
            ranking4: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Ranking 5'
             */
            ranking5: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Ranking 6'
             */
            ranking6: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Ranking 7'
             */
            ranking7: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Ranking 8'
             */
            ranking8: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Ranking 9'
             */
            ranking9: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Raw Metar'
             */
            rawMetar: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Raw Taf'
             */
            rawTaf: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Segment 1'
             */
            segment1: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Segment 10'
             */
            segment10: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Segment 2'
             */
            segment2: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Segment 3'
             */
            segment3: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Segment 4'
             */
            segment4: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Segment 5'
             */
            segment5: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Segment 6'
             */
            segment6: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Segment 7'
             */
            segment7: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Segment 8'
             */
            segment8: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Segment 9'
             */
            segment9: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Sunrise'
             */
            sunrise: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Sunset'
             */
            sunset: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Timestamp'
             */
            timestamp: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Unique ID'
             */
            uniqueId: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Warnings'
             */
            warnings: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Weather Source'
             */
            weatherSource: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            windDirection: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            windSpeed: $PropertyDef<'integer', 'nullable', 'single'>;
        };
        rid: 'ri.ontology.main.object-type.bfa83e2a-da8c-4f17-9f41-645d90b73745';
        status: 'EXPERIMENTAL';
        titleProperty: 'airportIcao';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const NorwayWeatherSegments: NorwayWeatherSegments;

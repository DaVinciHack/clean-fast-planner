import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { MainFlightObjectFp2 } from './MainFlightObjectFp2.js';
import type { NorwayWeatherXv8 } from './NorwayWeatherXv8.js';
import type { InternationalWeather } from './InternationalWeather.js';
import type { AllGtLocationsV2 } from './AllGtLocationsV2.js';
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
        readonly airportIcao: $PropType['string'] | undefined;
        readonly airportRanking: $PropType['integer'] | undefined;
        readonly altApproachType: $PropType['string'] | undefined;
        readonly alternateBearing: $PropType['integer'] | undefined;
        readonly alternateGeoShape: $PropType['geoshape'] | undefined;
        readonly alternateRanking: $PropType['double'] | undefined;
        readonly altRunway: $PropType['integer'] | undefined;
        readonly approachRanking: $PropType['integer'] | undefined;
        readonly approachSegment: $PropType['string'] | undefined;
        readonly araRequired: $PropType['boolean'] | undefined;
        readonly arrivalTime: $PropType['string'] | undefined;
        readonly crosswindComponent: $PropType['integer'] | undefined;
        readonly deckReport: $PropType['string'] | undefined;
        readonly distanceForAlternate: $PropType['double'] | undefined;
        readonly distanceFromDeparture: $PropType['double'] | undefined;
        readonly distanceFromDestination: $PropType['double'] | undefined;
        readonly estimatedFlightTime: $PropType['string'] | undefined;
        readonly flightUuid: $PropType['string'] | undefined;
        readonly geoPoint: $PropType['geopoint'] | undefined;
        readonly isAccessible: $PropType['boolean'] | undefined;
        readonly isAlternateFor: $PropType['string'] | undefined;
        readonly isDaytime: $PropType['boolean'] | undefined;
        readonly isRig: $PropType['boolean'] | undefined;
        readonly limitations: $PropType['string'] | undefined;
        readonly notams: $PropType['string'] | undefined;
        readonly ranking1: $PropType['integer'] | undefined;
        readonly ranking10: $PropType['integer'] | undefined;
        readonly ranking2: $PropType['integer'] | undefined;
        readonly ranking3: $PropType['integer'] | undefined;
        readonly ranking4: $PropType['integer'] | undefined;
        readonly ranking5: $PropType['integer'] | undefined;
        readonly ranking6: $PropType['integer'] | undefined;
        readonly ranking7: $PropType['integer'] | undefined;
        readonly ranking8: $PropType['integer'] | undefined;
        readonly ranking9: $PropType['integer'] | undefined;
        readonly rawMetar: $PropType['string'] | undefined;
        readonly rawTaf: $PropType['string'] | undefined;
        readonly segment1: $PropType['string'] | undefined;
        readonly segment10: $PropType['string'] | undefined;
        readonly segment2: $PropType['string'] | undefined;
        readonly segment3: $PropType['string'] | undefined;
        readonly segment4: $PropType['string'] | undefined;
        readonly segment5: $PropType['string'] | undefined;
        readonly segment6: $PropType['string'] | undefined;
        readonly segment7: $PropType['string'] | undefined;
        readonly segment8: $PropType['string'] | undefined;
        readonly segment9: $PropType['string'] | undefined;
        readonly sunrise: $PropType['timestamp'] | undefined;
        readonly sunset: $PropType['timestamp'] | undefined;
        readonly timestamp: $PropType['timestamp'] | undefined;
        readonly uniqueId: $PropType['string'];
        readonly warnings: $PropType['string'] | undefined;
        readonly weatherSource: $PropType['string'] | undefined;
        readonly windDirection: $PropType['integer'] | undefined;
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
             *   display name: 'Airport Icao',
             *   description: weather segment location name
             */
            airportIcao: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            airportRanking: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            altApproachType: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            alternateBearing: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            alternateGeoShape: $PropertyDef<'geoshape', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            alternateRanking: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            altRunway: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            approachRanking: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            approachSegment: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Ara Required'
             */
            araRequired: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             *   display name: 'Arrival Time'
             */
            arrivalTime: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            crosswindComponent: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Deck Report'
             */
            deckReport: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            distanceForAlternate: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            distanceFromDeparture: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            distanceFromDestination: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            estimatedFlightTime: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Flight Uuid'
             */
            flightUuid: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Geo Point'
             */
            geoPoint: $PropertyDef<'geopoint', 'nullable', 'single'>;
            /**
             *   display name: 'Is Accessible'
             */
            isAccessible: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            isAlternateFor: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Is Daytime'
             */
            isDaytime: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             *   display name: 'Is Rig'
             */
            isRig: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             *   display name: 'Limitations'
             */
            limitations: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Notams'
             */
            notams: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Ranking 1'
             */
            ranking1: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Ranking 10'
             */
            ranking10: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Ranking 2'
             */
            ranking2: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Ranking 3'
             */
            ranking3: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Ranking 4'
             */
            ranking4: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Ranking 5'
             */
            ranking5: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Ranking 6'
             */
            ranking6: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Ranking 7'
             */
            ranking7: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Ranking 8'
             */
            ranking8: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Ranking 9'
             */
            ranking9: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Raw Metar'
             */
            rawMetar: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Raw Taf'
             */
            rawTaf: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Segment 1'
             */
            segment1: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Segment 10'
             */
            segment10: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Segment 2'
             */
            segment2: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Segment 3'
             */
            segment3: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Segment 4'
             */
            segment4: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Segment 5'
             */
            segment5: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Segment 6'
             */
            segment6: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Segment 7'
             */
            segment7: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Segment 8'
             */
            segment8: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Segment 9'
             */
            segment9: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Sunrise'
             */
            sunrise: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             *   display name: 'Sunset'
             */
            sunset: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             *   display name: 'Timestamp'
             */
            timestamp: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             *   display name: 'Unique ID'
             */
            uniqueId: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             *   display name: 'Warnings'
             */
            warnings: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Weather Source'
             */
            weatherSource: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            windDirection: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
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

import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { AllGtLocationsV2 } from './AllGtLocationsV2.js';
import type { NorwayWeatherSegments } from './NorwayWeatherSegments.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition, ObjectMetadata as $ObjectMetadata } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType } from '@osdk/client';
export declare namespace NorwayWeatherXv8 {
    type PropertyKeys = 'waveHeights' | 'windSpeed' | 'rawMetar' | 'fullName' | 'visibilityScore' | 'delayChance' | 'lightningChance' | 'rawTaf' | 'timestamp' | 'windDirection' | 'icaoCode' | 'weatherId' | 'uuid' | 'locationId' | 'geopoint' | 'isAirport' | 'parsedData';
    interface Links {
        readonly allGtLocationsV2: AllGtLocationsV2.ObjectSet;
        readonly norwayWeatherSegments: NorwayWeatherSegments.ObjectSet;
    }
    interface Props {
        readonly delayChance: $PropType['double'] | undefined;
        readonly fullName: $PropType['string'] | undefined;
        readonly geopoint: $PropType['geopoint'] | undefined;
        readonly icaoCode: $PropType['string'];
        readonly isAirport: $PropType['boolean'] | undefined;
        readonly lightningChance: $PropType['double'] | undefined;
        readonly locationId: $PropType['integer'] | undefined;
        readonly parsedData: $PropType['string'] | undefined;
        readonly rawMetar: $PropType['string'] | undefined;
        readonly rawTaf: $PropType['string'] | undefined;
        readonly timestamp: $PropType['timestamp'] | undefined;
        readonly uuid: $PropType['string'] | undefined;
        readonly visibilityScore: $PropType['integer'] | undefined;
        readonly waveHeights: $PropType['double'] | undefined;
        readonly weatherId: $PropType['integer'] | undefined;
        readonly windDirection: $PropType['integer'] | undefined;
        readonly windSpeed: $PropType['integer'] | undefined;
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<NorwayWeatherXv8, NorwayWeatherXv8.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof NorwayWeatherXv8.Props = keyof NorwayWeatherXv8.Props> = $Osdk.Instance<NorwayWeatherXv8, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof NorwayWeatherXv8.Props = keyof NorwayWeatherXv8.Props> = OsdkInstance<OPTIONS, K>;
}
export interface NorwayWeatherXv8 extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'NorwayWeatherXv8';
    __DefinitionMetadata?: {
        objectSet: NorwayWeatherXv8.ObjectSet;
        props: NorwayWeatherXv8.Props;
        linksType: NorwayWeatherXv8.Links;
        strictProps: NorwayWeatherXv8.StrictProps;
        apiName: 'NorwayWeatherXv8';
        description: 'Weather backing for Norway dburbury';
        displayName: 'norwayWeatherXV8';
        icon: {
            type: 'blueprint';
            color: '#F5498B';
            name: 'cloud-upload';
        };
        implements: [];
        interfaceMap: {};
        inverseInterfaceMap: {};
        links: {
            allGtLocationsV2: $ObjectMetadata.Link<AllGtLocationsV2, true>;
            norwayWeatherSegments: $ObjectMetadata.Link<NorwayWeatherSegments, true>;
        };
        pluralDisplayName: 'norway Weather XV8s';
        primaryKeyApiName: 'icaoCode';
        primaryKeyType: 'string';
        properties: {
            /**
             *   display name: 'Delay Chance'
             */
            delayChance: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'Full Name'
             */
            fullName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Geopoint'
             */
            geopoint: $PropertyDef<'geopoint', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            icaoCode: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            isAirport: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             *   display name: 'Lightning Chance'
             */
            lightningChance: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'Location Id'
             */
            locationId: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Parsed Data'
             */
            parsedData: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Raw Metar'
             */
            rawMetar: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Raw Taf'
             */
            rawTaf: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Timestamp'
             */
            timestamp: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             *   display name: 'Uuid'
             */
            uuid: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Visibility Score'
             */
            visibilityScore: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Wave Heights'
             */
            waveHeights: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'Weather Id'
             */
            weatherId: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Wind Direction'
             */
            windDirection: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Wind Speed'
             */
            windSpeed: $PropertyDef<'integer', 'nullable', 'single'>;
        };
        rid: 'ri.ontology.main.object-type.5e395d80-3943-4d68-bab8-868234be8fff';
        status: 'EXPERIMENTAL';
        titleProperty: 'icaoCode';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const NorwayWeatherXv8: NorwayWeatherXv8;

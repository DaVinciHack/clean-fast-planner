import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { AllGtLocationsV2 } from './AllGtLocationsV2.js';
import type { NorwayWeatherSegments } from './NorwayWeatherSegments.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition, ObjectMetadata as $ObjectMetadata } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType, SingleLinkAccessor as $SingleLinkAccessor } from '@osdk/client';
export declare namespace InternationalWeather {
    type PropertyKeys = 'country' | 'waveHeights' | 'windSpeed' | 'rawMetar' | 'fullName' | 'visibilityScore' | 'delayChance' | 'lightningChance' | 'flightCategory' | 'rawTaf' | 'timestamp' | 'windDirection' | 'icaoCode' | 'region' | 'weatherId' | 'geopoint' | 'lastUpdated' | 'bbox' | 'isAirport' | 'parsedData';
    interface Links {
        readonly allGtLocationsV2: $SingleLinkAccessor<AllGtLocationsV2>;
        readonly weatherSegments: NorwayWeatherSegments.ObjectSet;
    }
    interface Props {
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   description: bounding box for the region
         */
        readonly bbox: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly country: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly delayChance: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly flightCategory: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly fullName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly geopoint: $PropType['geopoint'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly icaoCode: $PropType['string'];
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly isAirport: $PropType['boolean'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly lastUpdated: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly lightningChance: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly parsedData: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly rawMetar: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: ' rawTaf'
         */
        readonly rawTaf: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly region: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: ' timestamp'
         */
        readonly timestamp: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly visibilityScore: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly waveHeights: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly weatherId: $PropType['string'] | undefined;
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
         *
         *   display name: ' windSpeed'
         */
        readonly windSpeed: $PropType['integer'] | undefined;
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<InternationalWeather, InternationalWeather.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof InternationalWeather.Props = keyof InternationalWeather.Props> = $Osdk.Instance<InternationalWeather, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof InternationalWeather.Props = keyof InternationalWeather.Props> = OsdkInstance<OPTIONS, K>;
}
export interface InternationalWeather extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'InternationalWeather';
    __DefinitionMetadata?: {
        objectSet: InternationalWeather.ObjectSet;
        props: InternationalWeather.Props;
        linksType: InternationalWeather.Links;
        strictProps: InternationalWeather.StrictProps;
        apiName: 'InternationalWeather';
        description: 'International Weather';
        displayName: 'International Weather';
        icon: {
            type: 'blueprint';
            color: '#3FA6DA';
            name: 'rain';
        };
        implements: [];
        interfaceMap: {};
        inverseInterfaceMap: {};
        links: {
            allGtLocationsV2: $ObjectMetadata.Link<AllGtLocationsV2, false>;
            weatherSegments: $ObjectMetadata.Link<NorwayWeatherSegments, true>;
        };
        pluralDisplayName: 'International Weathers';
        primaryKeyApiName: 'icaoCode';
        primaryKeyType: 'string';
        properties: {
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   description: bounding box for the region
             */
            bbox: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            country: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            delayChance: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            flightCategory: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            fullName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            geopoint: $PropertyDef<'geopoint', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            icaoCode: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            isAirport: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            lastUpdated: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            lightningChance: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            parsedData: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            rawMetar: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: ' rawTaf'
             */
            rawTaf: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            region: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: ' timestamp'
             */
            timestamp: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            visibilityScore: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            waveHeights: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            weatherId: $PropertyDef<'string', 'nullable', 'single'>;
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
             *
             *   display name: ' windSpeed'
             */
            windSpeed: $PropertyDef<'integer', 'nullable', 'single'>;
        };
        rid: 'ri.ontology.main.object-type.fbd13f87-c5dc-45ab-b125-38a9bf3db4bd';
        status: 'EXPERIMENTAL';
        titleProperty: 'icaoCode';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const InternationalWeather: InternationalWeather;

import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { NorwayWeatherSegments } from './NorwayWeatherSegments.js';
import type { InternationalWeather } from './InternationalWeather.js';
import type { NorwayWeatherXv8 } from './NorwayWeatherXv8.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition, ObjectMetadata as $ObjectMetadata } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType, SingleLinkAccessor as $SingleLinkAccessor } from '@osdk/client';
export declare namespace AllGtLocationsV2 {
    type PropertyKeys = 'lat' | 'cachedAlternates' | 'id' | 'activeSite' | 'dataFrom' | 'fuelAvailable' | 'cachedAlternatesCount' | 'locationNotes' | 'locationRadioNotes' | 'timeZone' | 'lrmRegionId' | 'geoPoint' | 'isbase' | 'region' | 'secondaryPhone' | 'isairport' | 'uuid' | 'locAlias' | 'fuelOwner' | 'referenceId' | 'customerAlias' | 'primaryRadio' | 'routeDirection' | 'timezoneOffset' | 'locationDescription' | 'alternatesCacheTimestamp' | 'primaryPhone' | 'locationCd' | 'lon' | 'locName' | 'lastUpdateDate' | 'locationType';
    interface Links {
        readonly internationalWeather: $SingleLinkAccessor<InternationalWeather>;
        readonly norwayWeatherSegments: NorwayWeatherSegments.ObjectSet;
        readonly norwayWeatherXv8: $SingleLinkAccessor<NorwayWeatherXv8>;
    }
    interface Props {
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'ACTIVE SITE'
         */
        readonly activeSite: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Alternates Cache Timestamp'
         */
        readonly alternatesCacheTimestamp: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Cached Alternates'
         */
        readonly cachedAlternates: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Cached Alternates Count'
         */
        readonly cachedAlternatesCount: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'CUSTOMER ALIAS'
         */
        readonly customerAlias: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'DATA FROM'
         */
        readonly dataFrom: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'FUEL AVAILABLE'
         */
        readonly fuelAvailable: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'FUEL OWNER'
         */
        readonly fuelOwner: $PropType['string'] | undefined;
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
         *   display name: 'ID'
         */
        readonly id: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'ISAIRPORT'
         */
        readonly isairport: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'ISBASE'
         */
        readonly isbase: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'LAST UPDATE DATE'
         */
        readonly lastUpdateDate: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'LAT'
         */
        readonly lat: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'LOC ALIAS'
         */
        readonly locAlias: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'LOCATION CD'
         */
        readonly locationCd: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'LOCATION DESCRIPTION'
         */
        readonly locationDescription: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'LOCATION NOTES'
         */
        readonly locationNotes: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'LOCATION RADIO NOTES'
         */
        readonly locationRadioNotes: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'LOCATION TYPE'
         */
        readonly locationType: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Airport Icao',
         *
         *   description: weather segment location name
         */
        readonly locName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'LON'
         */
        readonly lon: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'LRM REGION ID'
         */
        readonly lrmRegionId: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'PRIMARY PHONE'
         */
        readonly primaryPhone: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'PRIMARY RADIO'
         */
        readonly primaryRadio: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'REFERENCE ID'
         */
        readonly referenceId: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'REGION'
         */
        readonly region: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Route Direction'
         */
        readonly routeDirection: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'SECONDARY PHONE'
         */
        readonly secondaryPhone: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'TIME ZONE'
         */
        readonly timeZone: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'TIMEZONE OFFSET'
         */
        readonly timezoneOffset: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Uuid'
         */
        readonly uuid: $PropType['string'];
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<AllGtLocationsV2, AllGtLocationsV2.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof AllGtLocationsV2.Props = keyof AllGtLocationsV2.Props> = $Osdk.Instance<AllGtLocationsV2, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof AllGtLocationsV2.Props = keyof AllGtLocationsV2.Props> = OsdkInstance<OPTIONS, K>;
}
export interface AllGtLocationsV2 extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'AllGtLocationsV2';
    __DefinitionMetadata?: {
        objectSet: AllGtLocationsV2.ObjectSet;
        props: AllGtLocationsV2.Props;
        linksType: AllGtLocationsV2.Links;
        strictProps: AllGtLocationsV2.StrictProps;
        apiName: 'AllGtLocationsV2';
        description: undefined;
        displayName: 'All GT Locations V2';
        icon: {
            type: 'blueprint';
            color: '#5f6b7c';
            name: 'map-marker';
        };
        implements: [];
        interfaceMap: {};
        inverseInterfaceMap: {};
        links: {
            internationalWeather: $ObjectMetadata.Link<InternationalWeather, false>;
            norwayWeatherSegments: $ObjectMetadata.Link<NorwayWeatherSegments, true>;
            norwayWeatherXv8: $ObjectMetadata.Link<NorwayWeatherXv8, false>;
        };
        pluralDisplayName: 'All GT Locations V2S';
        primaryKeyApiName: 'uuid';
        primaryKeyType: 'string';
        properties: {
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'ACTIVE SITE'
             */
            activeSite: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Alternates Cache Timestamp'
             */
            alternatesCacheTimestamp: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Cached Alternates'
             */
            cachedAlternates: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Cached Alternates Count'
             */
            cachedAlternatesCount: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'CUSTOMER ALIAS'
             */
            customerAlias: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'DATA FROM'
             */
            dataFrom: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'FUEL AVAILABLE'
             */
            fuelAvailable: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'FUEL OWNER'
             */
            fuelOwner: $PropertyDef<'string', 'nullable', 'single'>;
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
             *   display name: 'ID'
             */
            id: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'ISAIRPORT'
             */
            isairport: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'ISBASE'
             */
            isbase: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'LAST UPDATE DATE'
             */
            lastUpdateDate: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'LAT'
             */
            lat: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'LOC ALIAS'
             */
            locAlias: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'LOCATION CD'
             */
            locationCd: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'LOCATION DESCRIPTION'
             */
            locationDescription: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'LOCATION NOTES'
             */
            locationNotes: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'LOCATION RADIO NOTES'
             */
            locationRadioNotes: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'LOCATION TYPE'
             */
            locationType: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Airport Icao',
             *
             *   description: weather segment location name
             */
            locName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'LON'
             */
            lon: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'LRM REGION ID'
             */
            lrmRegionId: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'PRIMARY PHONE'
             */
            primaryPhone: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'PRIMARY RADIO'
             */
            primaryRadio: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'REFERENCE ID'
             */
            referenceId: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'REGION'
             */
            region: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Route Direction'
             */
            routeDirection: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'SECONDARY PHONE'
             */
            secondaryPhone: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'TIME ZONE'
             */
            timeZone: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'TIMEZONE OFFSET'
             */
            timezoneOffset: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Uuid'
             */
            uuid: $PropertyDef<'string', 'non-nullable', 'single'>;
        };
        rid: 'ri.ontology.main.object-type.fa2cca42-89a1-4a7d-ad8c-7d9539e95949';
        status: 'EXPERIMENTAL';
        titleProperty: 'locName';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const AllGtLocationsV2: AllGtLocationsV2;

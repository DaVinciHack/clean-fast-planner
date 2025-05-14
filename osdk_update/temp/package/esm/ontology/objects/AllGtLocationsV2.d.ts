import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { NorwayWeatherXv8 } from './NorwayWeatherXv8.js';
import type { InternationalWeather } from './InternationalWeather.js';
import type { NorwayWeatherSegments } from './NorwayWeatherSegments.js';
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
        readonly activeSite: $PropType['string'] | undefined;
        readonly alternatesCacheTimestamp: $PropType['timestamp'] | undefined;
        readonly cachedAlternates: $PropType['string'] | undefined;
        readonly cachedAlternatesCount: $PropType['integer'] | undefined;
        readonly customerAlias: $PropType['string'] | undefined;
        readonly dataFrom: $PropType['string'] | undefined;
        readonly fuelAvailable: $PropType['string'] | undefined;
        readonly fuelOwner: $PropType['string'] | undefined;
        readonly geoPoint: $PropType['geopoint'] | undefined;
        readonly id: $PropType['string'] | undefined;
        readonly isairport: $PropType['string'] | undefined;
        readonly isbase: $PropType['string'] | undefined;
        readonly lastUpdateDate: $PropType['timestamp'] | undefined;
        readonly lat: $PropType['double'] | undefined;
        readonly locAlias: $PropType['string'] | undefined;
        readonly locationCd: $PropType['string'] | undefined;
        readonly locationDescription: $PropType['string'] | undefined;
        readonly locationNotes: $PropType['string'] | undefined;
        readonly locationRadioNotes: $PropType['string'] | undefined;
        readonly locationType: $PropType['string'] | undefined;
        readonly locName: $PropType['string'] | undefined;
        readonly lon: $PropType['double'] | undefined;
        readonly lrmRegionId: $PropType['integer'] | undefined;
        readonly primaryPhone: $PropType['string'] | undefined;
        readonly primaryRadio: $PropType['string'] | undefined;
        readonly referenceId: $PropType['integer'] | undefined;
        readonly region: $PropType['string'] | undefined;
        readonly routeDirection: $PropType['string'] | undefined;
        readonly secondaryPhone: $PropType['string'] | undefined;
        readonly timeZone: $PropType['string'] | undefined;
        readonly timezoneOffset: $PropType['double'] | undefined;
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
             *   display name: 'ACTIVE SITE'
             */
            activeSite: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Alternates Cache Timestamp'
             */
            alternatesCacheTimestamp: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             *   display name: 'Cached Alternates'
             */
            cachedAlternates: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Cached Alternates Count'
             */
            cachedAlternatesCount: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'CUSTOMER ALIAS'
             */
            customerAlias: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'DATA FROM'
             */
            dataFrom: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'FUEL AVAILABLE'
             */
            fuelAvailable: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'FUEL OWNER'
             */
            fuelOwner: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Geo Point'
             */
            geoPoint: $PropertyDef<'geopoint', 'nullable', 'single'>;
            /**
             *   display name: 'ID'
             */
            id: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'ISAIRPORT'
             */
            isairport: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'ISBASE'
             */
            isbase: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'LAST UPDATE DATE'
             */
            lastUpdateDate: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             *   display name: 'LAT'
             */
            lat: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'LOC ALIAS'
             */
            locAlias: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'LOCATION CD'
             */
            locationCd: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'LOCATION DESCRIPTION'
             */
            locationDescription: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'LOCATION NOTES'
             */
            locationNotes: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'LOCATION RADIO NOTES'
             */
            locationRadioNotes: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'LOCATION TYPE'
             */
            locationType: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Airport Icao',
             *   description: weather segment location name
             */
            locName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'LON'
             */
            lon: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'LRM REGION ID'
             */
            lrmRegionId: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'PRIMARY PHONE'
             */
            primaryPhone: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'PRIMARY RADIO'
             */
            primaryRadio: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'REFERENCE ID'
             */
            referenceId: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'REGION'
             */
            region: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Route Direction'
             */
            routeDirection: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'SECONDARY PHONE'
             */
            secondaryPhone: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'TIME ZONE'
             */
            timeZone: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'TIMEZONE OFFSET'
             */
            timezoneOffset: $PropertyDef<'double', 'nullable', 'single'>;
            /**
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

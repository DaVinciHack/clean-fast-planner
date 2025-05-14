import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType } from '@osdk/client';
export declare namespace BristowHelidecks {
    type PropertyKeys = 'locationAlias' | 'cautions' | 'locationName' | 'baseOfOperation' | 'sourceIds' | 'fuelAvailable' | 'attachmentIds' | 'deckDvalue' | 'deckMaxWeight' | 'timeZone' | 'deckReportReceivedTime' | 'geoPoint' | 'weatherInformation' | 'ndb' | 'longName' | 'latestDeckReport' | 'createdDate' | 'validityDate' | 'nightStatus' | 'createdBy' | 'isActive' | 'updatedDate' | 'deckReportAttachmentId' | 'imageUrls' | 'deckDimensionsWidth' | 'issueDate' | 'isFixed' | 'limitations' | 'nonCompliance' | 'deckDimensionsLength' | 'deckHeading' | 'sourceSystems' | 'locationId' | 'locationType' | 'latitude' | 'updatedBy' | 'dayStatus' | 'deckReportSource' | 'deckHeight' | 'generalNotes' | 'weatherAvailable' | 'region' | 'lastInspectionDate' | 'fuelStatus' | 'longitude' | 'primaryRadio' | 'locationDescription' | 'primaryPhone' | 'parkDimensionsLength' | 'parkDvalue' | 'aimingCircle' | 'parkDimensionsWidth';
    type Links = {};
    interface Props {
        readonly aimingCircle: $PropType['string'] | undefined;
        readonly attachmentIds: $PropType['string'][] | undefined;
        readonly baseOfOperation: $PropType['string'] | undefined;
        readonly cautions: $PropType['string'] | undefined;
        readonly createdBy: $PropType['string'] | undefined;
        readonly createdDate: $PropType['timestamp'] | undefined;
        readonly dayStatus: $PropType['string'] | undefined;
        readonly deckDimensionsLength: $PropType['double'] | undefined;
        readonly deckDimensionsWidth: $PropType['double'] | undefined;
        readonly deckDvalue: $PropType['double'] | undefined;
        readonly deckHeading: $PropType['integer'] | undefined;
        readonly deckHeight: $PropType['double'] | undefined;
        readonly deckMaxWeight: $PropType['double'] | undefined;
        readonly deckReportAttachmentId: $PropType['string'] | undefined;
        readonly deckReportReceivedTime: $PropType['timestamp'] | undefined;
        readonly deckReportSource: $PropType['string'] | undefined;
        readonly fuelAvailable: $PropType['string'] | undefined;
        readonly fuelStatus: $PropType['string'] | undefined;
        readonly generalNotes: $PropType['string'] | undefined;
        readonly geoPoint: $PropType['geopoint'] | undefined;
        readonly imageUrls: $PropType['string'][] | undefined;
        readonly isActive: $PropType['string'] | undefined;
        readonly isFixed: $PropType['string'] | undefined;
        readonly issueDate: $PropType['timestamp'] | undefined;
        readonly lastInspectionDate: $PropType['timestamp'] | undefined;
        readonly latestDeckReport: $PropType['string'] | undefined;
        readonly latitude: $PropType['double'] | undefined;
        readonly limitations: $PropType['string'] | undefined;
        readonly locationAlias: $PropType['string'] | undefined;
        readonly locationDescription: $PropType['string'] | undefined;
        readonly locationId: $PropType['string'];
        readonly locationName: $PropType['string'] | undefined;
        readonly locationType: $PropType['string'] | undefined;
        readonly longitude: $PropType['double'] | undefined;
        readonly longName: $PropType['string'] | undefined;
        readonly ndb: $PropType['string'] | undefined;
        readonly nightStatus: $PropType['string'] | undefined;
        readonly nonCompliance: $PropType['string'] | undefined;
        readonly parkDimensionsLength: $PropType['double'] | undefined;
        readonly parkDimensionsWidth: $PropType['double'] | undefined;
        readonly parkDvalue: $PropType['double'] | undefined;
        readonly primaryPhone: $PropType['string'] | undefined;
        readonly primaryRadio: $PropType['string'] | undefined;
        readonly region: $PropType['string'] | undefined;
        readonly sourceIds: $PropType['string'][] | undefined;
        readonly sourceSystems: $PropType['string'][] | undefined;
        readonly timeZone: $PropType['string'] | undefined;
        readonly updatedBy: $PropType['string'] | undefined;
        readonly updatedDate: $PropType['timestamp'] | undefined;
        readonly validityDate: $PropType['timestamp'] | undefined;
        readonly weatherAvailable: $PropType['string'] | undefined;
        readonly weatherInformation: $PropType['string'] | undefined;
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<BristowHelidecks, BristowHelidecks.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof BristowHelidecks.Props = keyof BristowHelidecks.Props> = $Osdk.Instance<BristowHelidecks, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof BristowHelidecks.Props = keyof BristowHelidecks.Props> = OsdkInstance<OPTIONS, K>;
}
export interface BristowHelidecks extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'BristowHelidecks';
    __DefinitionMetadata?: {
        objectSet: BristowHelidecks.ObjectSet;
        props: BristowHelidecks.Props;
        linksType: BristowHelidecks.Links;
        strictProps: BristowHelidecks.StrictProps;
        apiName: 'BristowHelidecks';
        description: 'All Helidecks  ';
        displayName: 'Bristow Helidecks';
        icon: {
            type: 'blueprint';
            color: '#3FA6DA';
            name: 'rig';
        };
        implements: [];
        interfaceMap: {};
        inverseInterfaceMap: {};
        links: {};
        pluralDisplayName: 'Bristow Helidecks';
        primaryKeyApiName: 'locationId';
        primaryKeyType: 'string';
        properties: {
            /**
             *   display name: 'Aiming Circle'
             */
            aimingCircle: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Attachment Ids'
             */
            attachmentIds: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             *   display name: 'Base Of Operation'
             */
            baseOfOperation: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Cautions'
             */
            cautions: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Created By'
             */
            createdBy: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Created Date'
             */
            createdDate: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             *   display name: 'Day Status'
             */
            dayStatus: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Deck Dimensions Length'
             */
            deckDimensionsLength: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'Deck Dimensions Width'
             */
            deckDimensionsWidth: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'Deck DValue'
             */
            deckDvalue: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'Deck Heading'
             */
            deckHeading: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: 'Deck Height'
             */
            deckHeight: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'Deck Max Weight'
             */
            deckMaxWeight: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'Deck Report Attachment Id'
             */
            deckReportAttachmentId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Deck Report Received Time'
             */
            deckReportReceivedTime: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             *   display name: 'Deck Report Source'
             */
            deckReportSource: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Fuel Available'
             */
            fuelAvailable: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Fuel Status'
             */
            fuelStatus: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'General Notes'
             */
            generalNotes: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Geo Point'
             */
            geoPoint: $PropertyDef<'geopoint', 'nullable', 'single'>;
            /**
             *   display name: 'Image Urls'
             */
            imageUrls: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             *   display name: 'Is Active'
             */
            isActive: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Is Fixed'
             */
            isFixed: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Issue Date'
             */
            issueDate: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             *   display name: 'Last Inspection Date'
             */
            lastInspectionDate: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             *   display name: 'Latest Deck Report'
             */
            latestDeckReport: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Latitude'
             */
            latitude: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'Limitations'
             */
            limitations: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Location Alias'
             */
            locationAlias: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Location Description'
             */
            locationDescription: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Location Id'
             */
            locationId: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             *   display name: 'Location Name'
             */
            locationName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Location Type'
             */
            locationType: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Longitude'
             */
            longitude: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'Long Name'
             */
            longName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'NDB'
             */
            ndb: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Night Status'
             */
            nightStatus: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Non Compliance'
             */
            nonCompliance: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Park Dimensions Length'
             */
            parkDimensionsLength: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'Park Dimensions Width'
             */
            parkDimensionsWidth: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'Park DValue'
             */
            parkDvalue: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             *   display name: 'Primary Phone'
             */
            primaryPhone: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Primary Radio'
             */
            primaryRadio: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Region'
             */
            region: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Source Ids'
             */
            sourceIds: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             *   display name: 'Source Systems'
             */
            sourceSystems: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             *   display name: 'Time Zone'
             */
            timeZone: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Updated By'
             */
            updatedBy: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Updated Date'
             */
            updatedDate: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             *   display name: 'Validity Date'
             */
            validityDate: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             *   display name: 'Weather Available'
             */
            weatherAvailable: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Weather Information'
             */
            weatherInformation: $PropertyDef<'string', 'nullable', 'single'>;
        };
        rid: 'ri.ontology.main.object-type.68f15a1b-1902-4ce1-8c9f-b74f42b8cfdb';
        status: 'EXPERIMENTAL';
        titleProperty: 'locationName';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const BristowHelidecks: BristowHelidecks;

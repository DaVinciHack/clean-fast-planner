import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { MainFlightObjectFp2 } from './MainFlightObjectFp2.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition, ObjectMetadata as $ObjectMetadata } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType, SingleLinkAccessor as $SingleLinkAccessor } from '@osdk/client';
export declare namespace MainFuelV2 {
    type PropertyKeys = 'plannedApproachFuel' | 'plannedReserveFuel' | 'actualFuelUplifteds' | 'minFuelBreakdown' | 'flightNumber' | 'plannedAraFuel' | 'stopDescriptions' | 'aircraft' | 'minTotalFuel' | 'stopExtraFuels' | 'stopReserveFuels' | 'stopDeckFuels' | 'policyUuid' | 'createdAt' | 'totalFuelUplifted' | 'stopContingencyFuels' | 'actualLandingFuels' | 'actualOffBlocksFuels' | 'totalFuelBurned' | 'automationSummary' | 'plannedAlternateFuel' | 'flightUuid' | 'stopAraFuels' | 'stopsMarkdownTable' | 'uuid' | 'stopTaxiFuels' | 'stopTripFuels' | 'actualFuelBurneds' | 'roundTripFuel' | 'stopApproachFuels' | 'stopLocations' | 'updatedAt' | 'stopRequiredFuels' | 'plannedDeckFuel' | 'plannedTaxiFuel' | 'plannedExtraFuel' | 'plannedTripFuel' | 'actualTakeOffFuels' | 'plannedContingencyFuel' | 'actualLegNames' | 'calculationUnit' | 'plannedContingencyAlternateFuel' | 'policyName' | 'displayUnit' | 'actualOnBlocksFuels' | 'stopExcessFuels';
    interface Links {
        readonly mainFlightObjectFp2: $SingleLinkAccessor<MainFlightObjectFp2>;
    }
    interface Props {
        readonly actualFuelBurneds: $PropType['integer'][] | undefined;
        readonly actualFuelUplifteds: $PropType['integer'][] | undefined;
        readonly actualLandingFuels: $PropType['integer'][] | undefined;
        readonly actualLegNames: $PropType['string'][] | undefined;
        readonly actualOffBlocksFuels: $PropType['integer'][] | undefined;
        readonly actualOnBlocksFuels: $PropType['integer'][] | undefined;
        readonly actualTakeOffFuels: $PropType['integer'][] | undefined;
        readonly aircraft: $PropType['string'] | undefined;
        readonly automationSummary: $PropType['string'] | undefined;
        readonly calculationUnit: $PropType['string'] | undefined;
        readonly createdAt: $PropType['timestamp'] | undefined;
        readonly displayUnit: $PropType['string'] | undefined;
        readonly flightNumber: $PropType['string'] | undefined;
        readonly flightUuid: $PropType['string'] | undefined;
        readonly minFuelBreakdown: $PropType['string'] | undefined;
        readonly minTotalFuel: $PropType['integer'] | undefined;
        readonly plannedAlternateFuel: $PropType['integer'] | undefined;
        readonly plannedApproachFuel: $PropType['integer'] | undefined;
        readonly plannedAraFuel: $PropType['integer'] | undefined;
        readonly plannedContingencyAlternateFuel: $PropType['integer'] | undefined;
        readonly plannedContingencyFuel: $PropType['integer'] | undefined;
        readonly plannedDeckFuel: $PropType['integer'] | undefined;
        readonly plannedExtraFuel: $PropType['integer'] | undefined;
        readonly plannedReserveFuel: $PropType['integer'] | undefined;
        readonly plannedTaxiFuel: $PropType['integer'] | undefined;
        readonly plannedTripFuel: $PropType['integer'] | undefined;
        readonly policyName: $PropType['string'] | undefined;
        readonly policyUuid: $PropType['string'] | undefined;
        readonly roundTripFuel: $PropType['integer'] | undefined;
        readonly stopApproachFuels: $PropType['integer'][] | undefined;
        readonly stopAraFuels: $PropType['integer'][] | undefined;
        readonly stopContingencyFuels: $PropType['integer'][] | undefined;
        readonly stopDeckFuels: $PropType['integer'][] | undefined;
        readonly stopDescriptions: $PropType['string'][] | undefined;
        readonly stopExcessFuels: $PropType['integer'][] | undefined;
        readonly stopExtraFuels: $PropType['integer'][] | undefined;
        readonly stopLocations: $PropType['string'][] | undefined;
        readonly stopRequiredFuels: $PropType['integer'][] | undefined;
        readonly stopReserveFuels: $PropType['integer'][] | undefined;
        readonly stopsMarkdownTable: $PropType['string'] | undefined;
        readonly stopTaxiFuels: $PropType['integer'][] | undefined;
        readonly stopTripFuels: $PropType['integer'][] | undefined;
        readonly totalFuelBurned: $PropType['integer'] | undefined;
        readonly totalFuelUplifted: $PropType['integer'] | undefined;
        readonly updatedAt: $PropType['timestamp'] | undefined;
        readonly uuid: $PropType['string'];
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<MainFuelV2, MainFuelV2.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof MainFuelV2.Props = keyof MainFuelV2.Props> = $Osdk.Instance<MainFuelV2, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof MainFuelV2.Props = keyof MainFuelV2.Props> = OsdkInstance<OPTIONS, K>;
}
export interface MainFuelV2 extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'MainFuelV2';
    __DefinitionMetadata?: {
        objectSet: MainFuelV2.ObjectSet;
        props: MainFuelV2.Props;
        linksType: MainFuelV2.Links;
        strictProps: MainFuelV2.StrictProps;
        apiName: 'MainFuelV2';
        description: 'Main fuel object for flight planner V2';
        displayName: 'Main Fuel V2';
        icon: {
            type: 'blueprint';
            color: '#3FA6DA';
            name: 'fuel';
        };
        implements: [];
        interfaceMap: {};
        inverseInterfaceMap: {};
        links: {
            mainFlightObjectFp2: $ObjectMetadata.Link<MainFlightObjectFp2, false>;
        };
        pluralDisplayName: 'Main Fuel V2s';
        primaryKeyApiName: 'uuid';
        primaryKeyType: 'string';
        properties: {
            /**
             * (no ontology metadata)
             */
            actualFuelBurneds: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * (no ontology metadata)
             */
            actualFuelUplifteds: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * (no ontology metadata)
             */
            actualLandingFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * (no ontology metadata)
             */
            actualLegNames: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * (no ontology metadata)
             */
            actualOffBlocksFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * (no ontology metadata)
             */
            actualOnBlocksFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * (no ontology metadata)
             */
            actualTakeOffFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * (no ontology metadata)
             */
            aircraft: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            automationSummary: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            calculationUnit: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            createdAt: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            displayUnit: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            flightNumber: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            flightUuid: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            minFuelBreakdown: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            minTotalFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            plannedAlternateFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            plannedApproachFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: ' plannedAraFuel'
             */
            plannedAraFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            plannedContingencyAlternateFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            plannedContingencyFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            plannedDeckFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: ' plannedExtraFuel'
             */
            plannedExtraFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            plannedReserveFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            plannedTaxiFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: '  plannedTripFuel'
             */
            plannedTripFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            policyName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            policyUuid: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            roundTripFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            stopApproachFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * (no ontology metadata)
             */
            stopAraFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * (no ontology metadata)
             */
            stopContingencyFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * (no ontology metadata)
             */
            stopDeckFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * (no ontology metadata)
             */
            stopDescriptions: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * (no ontology metadata)
             */
            stopExcessFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             *   display name: ' stopExtraFuels'
             */
            stopExtraFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             *   display name: ' stopLocations'
             */
            stopLocations: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             *   display name: 'stopRequiredFuels '
             */
            stopRequiredFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * (no ontology metadata)
             */
            stopReserveFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * (no ontology metadata)
             */
            stopsMarkdownTable: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            stopTaxiFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             *   display name: ' stopTripFuels'
             */
            stopTripFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * (no ontology metadata)
             */
            totalFuelBurned: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * (no ontology metadata)
             */
            totalFuelUplifted: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             *   display name: ' updatedAt'
             */
            updatedAt: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             *   display name: ' uuid'
             */
            uuid: $PropertyDef<'string', 'non-nullable', 'single'>;
        };
        rid: 'ri.ontology.main.object-type.250465c9-55b6-42a5-b6da-806ffafd35a8';
        status: 'EXPERIMENTAL';
        titleProperty: 'flightNumber';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const MainFuelV2: MainFuelV2;

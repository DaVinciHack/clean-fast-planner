import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType } from '@osdk/client';
export declare namespace User {
    type PropertyKeys = 'workShift' | 'email' | 'costCenterName' | 'scheduleTsSync' | 'startDate' | 'jobName' | 'userId' | 'status' | 'costCenterId' | 'employeeId' | 'location' | 'fullName' | 'dateOfBirth' | 'timeZone' | 'deptId' | 'sapCompanyId' | 'userPersonType' | 'jobId' | 'foundryUsername' | 'isPilot' | 'username' | 'foundryEmail' | 'jobFamilyGroup' | 'aoc' | 'orgUnit' | 'organization' | 'endDate' | 'country' | 'foundryUserId' | 'lastName' | 'deptName' | 'employeeNumber' | 'assignmentEndDate' | 'jobDescription' | 'firstName' | 'orgAoc' | 'assignmentStartDate' | 'supervisorEmpNumber' | 'state' | 'companyName';
    type Links = {};
    interface Props {
        readonly aoc: $PropType['string'] | undefined;
        readonly assignmentEndDate: $PropType['datetime'] | undefined;
        readonly assignmentStartDate: $PropType['datetime'] | undefined;
        readonly companyName: $PropType['string'] | undefined;
        readonly costCenterId: $PropType['string'] | undefined;
        readonly costCenterName: $PropType['string'] | undefined;
        readonly country: $PropType['string'] | undefined;
        readonly dateOfBirth: $PropType['string'] | undefined;
        readonly deptId: $PropType['string'] | undefined;
        readonly deptName: $PropType['string'] | undefined;
        readonly email: $PropType['string'] | undefined;
        readonly employeeId: $PropType['string'] | undefined;
        readonly employeeNumber: $PropType['string'] | undefined;
        readonly endDate: $PropType['datetime'] | undefined;
        readonly firstName: $PropType['string'] | undefined;
        readonly foundryEmail: $PropType['string'] | undefined;
        readonly foundryUserId: $PropType['string'] | undefined;
        readonly foundryUsername: $PropType['string'] | undefined;
        readonly fullName: $PropType['string'] | undefined;
        readonly isPilot: $PropType['boolean'] | undefined;
        readonly jobDescription: $PropType['string'] | undefined;
        readonly jobFamilyGroup: $PropType['string'] | undefined;
        readonly jobId: $PropType['string'] | undefined;
        readonly jobName: $PropType['string'] | undefined;
        readonly lastName: $PropType['string'] | undefined;
        readonly location: $PropType['string'] | undefined;
        readonly organization: $PropType['string'] | undefined;
        readonly orgAoc: $PropType['string'] | undefined;
        readonly orgUnit: $PropType['string'] | undefined;
        readonly sapCompanyId: $PropType['string'] | undefined;
        readonly scheduleTsSync: $PropType['stringTimeseries'] | undefined;
        readonly startDate: $PropType['datetime'] | undefined;
        readonly state: $PropType['string'] | undefined;
        readonly status: $PropType['string'] | undefined;
        readonly supervisorEmpNumber: $PropType['string'] | undefined;
        readonly timeZone: $PropType['string'] | undefined;
        readonly userId: $PropType['string'];
        readonly username: $PropType['string'] | undefined;
        readonly userPersonType: $PropType['string'] | undefined;
        readonly workShift: $PropType['string'] | undefined;
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<User, User.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof User.Props = keyof User.Props> = $Osdk.Instance<User, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof User.Props = keyof User.Props> = OsdkInstance<OPTIONS, K>;
}
export interface User extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'User';
    __DefinitionMetadata?: {
        objectSet: User.ObjectSet;
        props: User.Props;
        linksType: User.Links;
        strictProps: User.StrictProps;
        apiName: 'User';
        description: '';
        displayName: 'User';
        icon: {
            type: 'blueprint';
            color: '#61c7f9';
            name: 'mugshot';
        };
        implements: [];
        interfaceMap: {};
        inverseInterfaceMap: {};
        links: {};
        pluralDisplayName: 'Users';
        primaryKeyApiName: 'userId';
        primaryKeyType: 'string';
        properties: {
            /**
             *   display name: 'Aoc'
             */
            aoc: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Assignment End Date'
             */
            assignmentEndDate: $PropertyDef<'datetime', 'nullable', 'single'>;
            /**
             *   display name: 'Assignment Start Date'
             */
            assignmentStartDate: $PropertyDef<'datetime', 'nullable', 'single'>;
            /**
             *   display name: 'Company Name'
             */
            companyName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Cost Center Id'
             */
            costCenterId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Cost Center Name'
             */
            costCenterName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Country'
             */
            country: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Date Of Birth'
             */
            dateOfBirth: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Dept Id'
             */
            deptId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Dept Name'
             */
            deptName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Email'
             */
            email: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Employee Id'
             */
            employeeId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Employee Number'
             */
            employeeNumber: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'End Date'
             */
            endDate: $PropertyDef<'datetime', 'nullable', 'single'>;
            /**
             *   display name: 'First Name'
             */
            firstName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Foundry Email'
             */
            foundryEmail: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Foundry User Id'
             */
            foundryUserId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Foundry Username'
             */
            foundryUsername: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Full Name'
             */
            fullName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Is Pilot'
             */
            isPilot: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             *   display name: 'Job Description'
             */
            jobDescription: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Job Family Group'
             */
            jobFamilyGroup: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Job Id'
             */
            jobId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Job Name'
             */
            jobName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Last Name'
             */
            lastName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Location'
             */
            location: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Organization'
             */
            organization: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Org Aoc'
             */
            orgAoc: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Org Unit'
             */
            orgUnit: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Sap Company Id'
             */
            sapCompanyId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Schedule Ts Sync'
             */
            scheduleTsSync: $PropertyDef<'stringTimeseries', 'nullable', 'single'>;
            /**
             *   display name: 'Start Date'
             */
            startDate: $PropertyDef<'datetime', 'nullable', 'single'>;
            /**
             *   display name: 'State'
             */
            state: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Status'
             */
            status: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Supervisor Emp Number'
             */
            supervisorEmpNumber: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Time Zone'
             */
            timeZone: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'User Id'
             */
            userId: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             *   display name: 'Username'
             */
            username: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'User Person Type'
             */
            userPersonType: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             *   display name: 'Work Shift'
             */
            workShift: $PropertyDef<'string', 'nullable', 'single'>;
        };
        rid: 'ri.ontology.main.object-type.bf45a3bd-f60f-400e-8fcf-5adc0a44e8de';
        status: 'EXPERIMENTAL';
        titleProperty: 'fullName';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const User: User;

import { effect, type ReadonlySignal } from '@preact/signals-react';
import {
  type ChangeEventHandler,
  type FocusEventHandler,
  type RefCallback,
  type ReactNode,
  useMemo,
} from 'react';
import { useLifecycle } from '../hooks';
import type {
  FieldElement,
  FieldPath,
  FieldPathValue,
  FieldType,
  FieldValues,
  FormStore,
  Maybe,
  MaybeArray,
  MaybeValue,
  PartialKey,
  ResponseData,
  TransformField,
  ValidateField,
} from '../types';
import {
  getElementInput,
  handleFieldEvent,
  initializeFieldStore,
} from '../utils';

/**
 * Value type ot the field store.
 */
export type FieldStore<
  TFieldValues extends FieldValues,
  TFieldName extends FieldPath<TFieldValues>
> = {
  name: TFieldName;
  value: ReadonlySignal<Maybe<FieldPathValue<TFieldValues, TFieldName>>>;
  error: ReadonlySignal<string>;
  active: ReadonlySignal<boolean>;
  touched: ReadonlySignal<boolean>;
  dirty: ReadonlySignal<boolean>;
};

/**
 * Value type of the field element props.
 */
export type FieldElementProps<
  TFieldValues extends FieldValues,
  TFieldName extends FieldPath<TFieldValues>
> = {
  name: TFieldName;
  ref: RefCallback<FieldElement>;
  onChange: ChangeEventHandler<FieldElement>;
  onBlur: FocusEventHandler<FieldElement>;
};

/**
 * Value type of the field props.
 */
export type FieldProps<
  TFieldValues extends FieldValues,
  TResponseData extends ResponseData,
  TFieldName extends FieldPath<TFieldValues>
> = {
  of: FormStore<TFieldValues, TResponseData>;
  name: TFieldName;
  type: FieldType<FieldPathValue<TFieldValues, TFieldName>>;
  children: (
    store: FieldStore<TFieldValues, TFieldName>,
    props: FieldElementProps<TFieldValues, TFieldName>
  ) => ReactNode;
  validate?: Maybe<
    MaybeArray<ValidateField<FieldPathValue<TFieldValues, TFieldName>>>
  >;
  transform?: Maybe<
    MaybeArray<TransformField<FieldPathValue<TFieldValues, TFieldName>>>
  >;
  keepActive?: boolean;
  keepState?: boolean;
};

/**
 * Headless form field that provides reactive properties and state.
 */
export function Field<
  TFieldValues extends FieldValues,
  TResponseData extends ResponseData,
  TFieldName extends FieldPath<TFieldValues>
>({
  children,
  type,
  ...props
}: FieldPathValue<TFieldValues, TFieldName> extends MaybeValue<string>
  ? PartialKey<FieldProps<TFieldValues, TResponseData, TFieldName>, 'type'>
  : FieldProps<TFieldValues, TResponseData, TFieldName>): JSX.Element {
  // Destructure props
  const { of: form, name } = props;

  // Get store of specified field
  const field = useMemo(() => initializeFieldStore(form, name), [form, name]);

  // Use lifecycle of field
  useLifecycle({ ...props, store: field });

  return (
    <>
      {children(
        useMemo(
          () => ({
            name,
            value: field.value,
            error: field.error,
            active: field.active,
            touched: field.touched,
            dirty: field.dirty,
          }),
          [field, name]
        ),
        useMemo(
          () => ({
            name,
            ref(element) {
              if (element) {
                // Add element to elements
                field.elements.value = [...field.elements.value, element];

                // Create effect that replaces initial input and input of field with
                // initial input of element if both is "undefined", so that dirty
                // state also resets to "false" when user removes input
                effect(() => {
                  if (
                    field.startValue.value === undefined &&
                    field.value.peek() === undefined
                  ) {
                    setTimeout(() => {
                      const input = getElementInput(element, field, type);
                      field.startValue.value = input;
                      field.value.value = input;
                    });
                  }
                });
              }
            },
            onChange(event) {
              handleFieldEvent(
                form,
                field,
                name,
                event,
                ['touched', 'change'],
                getElementInput(event.currentTarget, field, type)
              );
            },
            onBlur(event) {
              handleFieldEvent(form, field, name, event, ['touched', 'blur']);
            },
          }),
          [field, form, name, type]
        )
      )}
    </>
  );
}
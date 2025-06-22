import React from 'react';
import { CheckCircle, Clock, DollarSign, Package } from 'lucide-react';

const steps = [
  { name: 'בקשה אושרה', icon: CheckCircle },
  { name: 'ממתין לתשלום', icon: Clock },
  { name: 'אישור תשלום', icon: DollarSign },
  { name: 'השכרה פעילה', icon: Package },
];

export default function RentalStatusTracker({ contractStatus, paymentStatus }) {
  let currentStepIndex = 0;

  if (contractStatus === 'פעיל') {
    currentStepIndex = 3;
  } else if (contractStatus === 'ממתין לאישור מנהלת') {
    currentStepIndex = 2;
  } else if (contractStatus === 'ממתין לתשלום') {
    if (paymentStatus === 'שילם') {
      currentStepIndex = 2; // This case is now covered by contract status 'ממתין לאישור מנהלת'
    } else {
      currentStepIndex = 1;
    }
  }

  return (
    <div className="w-full">
      <nav aria-label="Progress">
        <ol role="list" className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
              {stepIdx < currentStepIndex ? (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-orange-600" />
                  </div>
                  <div className="relative w-8 h-8 flex items-center justify-center bg-orange-600 rounded-full hover:bg-orange-700">
                    <step.icon className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                  <span className="absolute -bottom-6 right-1/2 transform translate-x-1/2 text-xs font-semibold text-orange-600 whitespace-nowrap">{step.name}</span>
                </>
              ) : stepIdx === currentStepIndex ? (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-gray-200" />
                  </div>
                  <div className="relative w-8 h-8 flex items-center justify-center bg-white border-2 border-orange-600 rounded-full">
                    <step.icon className="w-5 h-5 text-orange-600" aria-hidden="true" />
                  </div>
                  <span className="absolute -bottom-6 right-1/2 transform translate-x-1/2 text-xs font-semibold text-orange-600 whitespace-nowrap">{step.name}</span>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-gray-200" />
                  </div>
                  <div className="relative w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-300 rounded-full group-hover:border-gray-400">
                    <step.icon className="w-5 h-5 text-gray-400" aria-hidden="true" />
                  </div>
                   <span className="absolute -bottom-6 right-1/2 transform translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">{step.name}</span>
                </>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
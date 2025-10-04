//
//  IssueFormView.swift
//  aegis
//
//  Created by David Jr on 10/2/25.
//

import SwiftUI

struct IssueFormView: View {
    @Environment(\.dismiss) var dismiss
    @StateObject var viewModel = IssueSubmissionViewModel()
    let capturedImage: UIImage

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Image Preview
                    if let image = viewModel.capturedImage {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFit()
                            .frame(height: 250)
                            .cornerRadius(10)
                    }

                    // AI Analysis Loading
                    if viewModel.isAnalyzing {
                        VStack(spacing: 10) {
                            ProgressView()
                            Text("AI is analyzing the image...")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                        .padding()
                    }

                    // Description Field (Editable)
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Description")
                            .font(.headline)

                        TextEditor(text: $viewModel.userEditedDescription)
                            .frame(height: 120)
                            .padding(8)
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(8)
                            .disabled(viewModel.isAnalyzing)
                    }

                    // Location
                    if !viewModel.location.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Location")
                                .font(.headline)
                            Text(viewModel.location)
                                .font(.caption)
                                .foregroundColor(.gray)
                                .padding(8)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color.gray.opacity(0.1))
                                .cornerRadius(8)
                        }
                    }

                    // Timestamp
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Timestamp")
                            .font(.headline)
                        Text(viewModel.timestamp, style: .date)
                            .font(.caption)
                            .foregroundColor(.gray)
                            .padding(8)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(8)
                    }

                    // Error Message
                    if let error = viewModel.error {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                            .padding()
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(8)
                    }

                    // Submit Button
                    Button(action: {
                        Task {
                            await viewModel.submitIssue()
                            if viewModel.successMessage != nil {
                                dismiss()
                            }
                        }
                    }) {
                        if viewModel.isSubmitting {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Text("Submit Issue")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(viewModel.isAnalyzing || viewModel.isSubmitting ? Color.gray : Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                    .disabled(viewModel.isAnalyzing || viewModel.isSubmitting)
                }
                .padding()
            }
            .navigationTitle("Report Issue")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
        .onAppear {
            Task {
                await viewModel.captureImageData(image: capturedImage)
            }
        }
    }
}
